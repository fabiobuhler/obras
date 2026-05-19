import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load and parse .env manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFullIntegrationTest() {
  let createdObra = null;
  let createdPessoa = null;
  let createdFuncionario = null;
  let createdEquipamento = null;
  let createdApontamento = null;

  try {
    console.log('=== INICIANDO CONVERSAÇÃO E CRIAÇÃO DE DADOS DE TESTE PARA VALIDAR RLS/FK ===');

    // 1. Criar Obra de Teste
    console.log('\n1. Criando obra de teste...');
    const { data: obra, error: errObra } = await supabase
      .from('obras')
      .insert({ objeto: 'Obra de Teste RLS' })
      .select()
      .single();

    if (errObra) {
      console.error('❌ Falha ao criar obra (Verifique se RLS impede inserções na tabela obras):', errObra.message);
      throw errObra;
    }
    createdObra = obra;
    console.log('✅ Obra criada com ID:', obra.id);

    // 2. Criar Pessoa de Teste
    console.log('\n2. Criando pessoa de teste...');
    const { data: pessoa, error: errPessoa } = await supabase
      .from('pessoas')
      .insert({ nome: 'Colaborador Teste RLS', cpf: '000.000.000-00' })
      .select()
      .single();

    if (errPessoa) {
      console.error('❌ Falha ao criar pessoa:', errPessoa.message);
      throw errPessoa;
    }
    createdPessoa = pessoa;
    console.log('✅ Pessoa criada com ID:', pessoa.id);

    // 3. Criar Funcionario de Teste
    console.log('\n3. Criando funcionário de teste...');
    const { data: func, error: errFunc } = await supabase
      .from('funcionarios')
      .insert({
        pessoa_id: pessoa.id,
        ativo: true,
        salario: 3000.00,
        cargo: 'Operador de Testes'
      })
      .select()
      .single();

    if (errFunc) {
      console.error('❌ Falha ao criar funcionário:', errFunc.message);
      throw errFunc;
    }
    createdFuncionario = func;
    console.log('✅ Funcionário criado com ID:', func.id);

    // 4. Criar Equipamento de Teste
    console.log('\n4. Criando equipamento de teste...');
    const { data: equip, error: errEquip } = await supabase
      .from('equipamentos')
      .insert({
        descricao: 'Equipamento Teste RLS',
        origem: 'proprio',
        situacao: 'disponível'
      })
      .select()
      .single();

    if (errEquip) {
      console.error('❌ Falha ao criar equipamento:', errEquip.message);
      throw errEquip;
    }
    createdEquipamento = equip;
    console.log('✅ Equipamento criado com ID:', equip.id);

    // 5. Criar Apontamento de Teste (Mão de Obra)
    console.log('\n5. Criando Apontamento de Mão de Obra...');
    const payloadApontamento = {
      obra_id: obra.id,
      tipo: 'mao_obra',
      funcionario_id: func.id,
      equipamento_id: null,
      data: new Date().toISOString().split('T')[0],
      quantidade_horas: 8,
      tipo_hora: 'normal',
      multiplicador: 1.0,
      valor_unitario: 15.0,
      custo_total: 120.0,
      descricao: 'Validação operacional de mão de obra',
      observacao: 'Inserido pelo validador automático Antigravity'
    };

    const { data: apontamento, error: errApontamento } = await supabase
      .from('apontamentos_obra')
      .insert(payloadApontamento)
      .select()
      .single();

    if (errApontamento) {
      console.error('❌ FALHA NO INSERT DE APONTAMENTO (Verifique as políticas RLS de apontamentos_obra!):', errApontamento.message);
      console.error(errApontamento);
      throw errApontamento;
    }
    createdApontamento = apontamento;
    console.log('✅ Apontamento de Mão de Obra registrado com sucesso! ID:', apontamento.id);

    // 6. Testando Update do Apontamento
    console.log('\n6. Testando update do apontamento...');
    const { data: updatedApont, error: errUpdate } = await supabase
      .from('apontamentos_obra')
      .update({ quantidade_horas: 10, custo_total: 150 })
      .eq('id', apontamento.id)
      .select()
      .single();

    if (errUpdate) {
      console.error('❌ Falha ao atualizar apontamento:', errUpdate.message);
      throw errUpdate;
    }
    console.log('✅ Apontamento atualizado! Nova quantidade de horas:', updatedApont.quantidade_horas);

    // 7. Testando Select Join completo do service
    console.log('\n7. Testando select join completo do service...');
    const { data: queryData, error: errQuery } = await supabase
      .from('apontamentos_obra')
      .select(`
        *,
        obras:obra_id (
          id,
          objeto
        ),
        funcionarios:funcionario_id (
          id,
          pessoa_id,
          pessoas:pessoa_id (
            id,
            nome,
            cpf
          )
        ),
        equipamentos:equipamento_id (
          id,
          codigo,
          descricao,
          tipo,
          categoria,
          patrimonio,
          fabricante,
          modelo
        )
      `)
      .eq('id', apontamento.id)
      .single();

    if (errQuery) {
      console.error('❌ Falha no select join:', errQuery.message);
      throw errQuery;
    }
    console.log('✅ Select join bem sucedido! Dados retornados com sucesso.');
    console.log('Nome do funcionário no join:', queryData.funcionarios?.pessoas?.nome);
    console.log('Objeto da obra no join:', queryData.obras?.objeto);

  } catch (err) {
    console.error('\n❌ O TESTE DE INTEGRAÇÃO FALHOU DEVIDO A UM ERRO.');
  } finally {
    console.log('\n--- INICIANDO LIMPEZA DE DADOS ---');
    if (createdApontamento) {
      console.log('Removendo apontamento...');
      await supabase.from('apontamentos_obra').delete().eq('id', createdApontamento.id);
    }
    if (createdEquipamento) {
      console.log('Removendo equipamento...');
      await supabase.from('equipamentos').delete().eq('id', createdEquipamento.id);
    }
    if (createdFuncionario) {
      console.log('Removendo funcionário...');
      await supabase.from('funcionarios').delete().eq('id', createdFuncionario.id);
    }
    if (createdPessoa) {
      console.log('Removendo pessoa...');
      await supabase.from('pessoas').delete().eq('id', createdPessoa.id);
    }
    if (createdObra) {
      console.log('Removendo obra...');
      await supabase.from('obras').delete().eq('id', createdObra.id);
    }
    console.log('✅ Limpeza concluída.');
  }
}

runFullIntegrationTest();
