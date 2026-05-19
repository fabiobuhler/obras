begin;

alter table public.contas_pagar
add column if not exists credor_avulso text null;

with dados as (
  select * from (
    values
      -- ======================================================
      -- Planilha: emails - pgto - provisao.xlsx
      -- ======================================================
      ('BeD', date '2026-05-28', 'BeD - protasio - contrato 165', 1776.00, 'Planilha emails - pgto - provisao. Email em 05/05/2026. Observação: protasio - contrato 165.'),
      ('BeD', date '2026-05-28', 'BeD - Betoneira - 471 e subestação Rissul - contrato 164', 450.00, 'Planilha emails - pgto - provisao. Email em 05/05/2026. Observação: Betoneira - 471 e subestação Rissul - contrato 164.'),
      ('BeD', date '2026-05-28', 'BeD - andaimes - subs rissul - contrato 195', 252.00, 'Planilha emails - pgto - provisao. Email em 05/05/2026. Observação: andaimes - subs rissul - contrato 195.'),
      ('BeD', date '2026-05-28', 'BeD - 2 diárias - andaime - Mal Hermes - Contrato 197', 96.00, 'Planilha emails - pgto - provisao. Email em 05/05/2026. Observação: 2 diárias - andaime - Mal Hermes - Contrato 197.'),
      ('BeD', date '2026-05-28', 'BeD - peças de andaime subs rissul - contrato 193', 80.00, 'Planilha emails - pgto - provisao. Email em 05/05/2026. Observação: peças de andaime subs rissul - contrato 193.'),
      ('BeD', date '2026-05-25', 'BeD - compactador tipo sapo - protasio - contrato 182', 350.00, 'Planilha emails - pgto - provisao. Email em 06/05/2026. Observação: compactador tipo sapo - protasio - contrato 182.'),
      ('BeD', date '2026-05-30', 'BeD - dano a 1 peça - 471 - Contrato 143', 48.00, 'Planilha emails - pgto - provisao. Email em 11/05/2026. Observação: dano a 1 peça - 471 - Contrato 143. Possível duplicidade com MODELO PGTO RVAL.'),
      ('BeD', date '2026-06-04', 'BeD - andaime - lumiarte - contrato 207', 279.00, 'Planilha emails - pgto - provisao. Email em 11/05/2026. Observação: andaime - lumiarte - contrato 207. Descontar esquadrias.'),
      ('BeD', date '2026-06-07', 'BeD - protasio - contrato 175', 920.00, 'Planilha emails - pgto - provisao. Email em 12/05/2026. Observação: protasio - contrato 175.'),
      ('BeD', date '2026-06-08', 'BeD - protasio - contrato 192', 355.00, 'Planilha emails - pgto - provisao. Email em 12/05/2026. Observação: protasio - contrato 192.'),
      ('BeD', date '2026-06-08', 'BeD - enceradeira - 471 - contrato 205', 280.00, 'Planilha emails - pgto - provisao. Email em 12/05/2026. Observação: enceradeira - 471 - contrato 205.'),
      ('FGTS', date '2026-05-20', 'FGTS', 214.96, 'Planilha emails - pgto - provisao. Email em 13/05/2026.'),
      ('BeD', date '2026-06-09', 'BeD - protasio - contrato 210', 630.00, 'Planilha emails - pgto - provisao. Email em 13/05/2026. Observação: protasio - contrato 210.'),
      ('BeD', date '2026-06-06', 'BeD - Mal Hermes - Contrato 190', 550.00, 'Planilha emails - pgto - provisao. Email em 13/05/2026. Observação: Mal Hermes - Contrato 190. Nota: lançar obra.'),
      ('BeD', date '2026-06-04', 'BeD - mal hermes - contrato 207', 279.00, 'Planilha emails - pgto - provisao. Email em 13/05/2026. Observação: mal hermes - contrato 207.'),
      ('DARF - CONTABILIDADE', date '2026-05-20', 'DARF - CONTABILIDADE - DCTFWEB', 66.51, 'Planilha emails - pgto - provisao. Email em 15/05/2026. Observação: DCTFWEB.'),
      ('BeD', date '2026-06-12', 'BeD - bomba protásio - contrato 214', 300.00, 'Planilha emails - pgto - provisao. Email em 18/05/2026. Observação: bomba protásio - contrato 214.'),
      ('BeD', date '2026-06-15', 'BeD - placa vibratoria - guaiba - contrato 215', 550.00, 'Planilha emails - pgto - provisao. Email em 18/05/2026. Observação: placa vibratoria - guaiba - contrato 215.'),
      ('BeD', date '2026-06-15', 'BeD - esmerilhadeira angular - contrato 188', 160.00, 'Planilha emails - pgto - provisao. Email em 18/05/2026. Observação: esmerilhadeira angular - contrato 188. Nota: qual obra?'),

      -- ======================================================
      -- Planilha: MODELO PGTO RVAL.xlsx
      -- ======================================================
      ('MAURO', date '2026-05-15', 'MAURO - Ver o que é possível ser feito', 15832.00, 'Planilha MODELO PGTO RVAL. Dados pagamento: enviado msg. Descrição: VER O QUE É POSSÍVEL SER FEITO - SEMANA PASSADA NÃO PAGAMOS.'),
      ('LUMIARTE', date '2026-05-15', 'LUMIARTE - negociação pendente', 11057.00, 'Planilha MODELO PGTO RVAL. Dados pagamento: enviado msg. Descrição: tentei negociar em 2x vezes e ele não aceitou.'),
      ('GHS', date '2026-05-15', 'GHS - saldo cortinas metálicas Mal Hermes', 13200.00, 'Planilha MODELO PGTO RVAL. Dados pagamento: Enviado msg. Descrição: SALDO DAS CORTINAS METALICAS MAL HERMES.'),
      ('JJ FUNILARIA', date '2026-05-15', 'JJ FUNILARIA - fechamento superior frontal Mal Hermes', 1500.00, 'Planilha MODELO PGTO RVAL. Dados pagamento: enviado msg.'),
      ('DIOGO', date '2026-05-15', 'DIOGO - locação lava jato - 471', 450.00, 'Planilha MODELO PGTO RVAL. Descrição: LOCAÇÃO LAVA JATO - 471.'),
      ('GRACE', date '2026-05-15', 'GRACE - ressarcimento', 294.54, 'Planilha MODELO PGTO RVAL. Descrição: RESSARCIMENTO.'),
      ('RODRIGO', date '2026-05-15', 'RODRIGO - ressarcimento - 08/05 a 15/05', 652.60, 'Planilha MODELO PGTO RVAL. Descrição: RESSARCIMENTO - DE 08/05 A 15/05.'),
      ('RODRIGO', date '2026-05-15', 'RODRIGO - ref proporcional abril', 1200.00, 'Planilha MODELO PGTO RVAL. Dados pagamento: R$1200 - 27 A 30/04.'),
      ('MESTR ALCEU', date '2026-05-20', 'MESTR ALCEU - salário ref abril - confirmar valor', 6000.00, 'Planilha MODELO PGTO RVAL. Descrição: SALARIO REF ABRIL - CONFIRMAR VALOR.'),
      ('TIAGO TANOS MARTINS', date '2026-05-20', 'TIAGO TANOS MARTINS - salário ref abril', 10000.00, 'Planilha MODELO PGTO RVAL. Descrição: SALARIO REF ABRIL.'),
      ('RODRIGO', date '2026-05-20', 'RODRIGO - adiantamento maio', 3600.00, 'Planilha MODELO PGTO RVAL. Descrição: REF ADIANTAMENTO MAIO.'),
      ('MARCELLO LUIZ FURTADO DOS SANTOS', date '2026-05-20', 'MARCELLO LUIZ FURTADO DOS SANTOS - topografia', 2800.00, 'Planilha MODELO PGTO RVAL. Seção: PROVISIONAMENTO. Dados pagamento: topografia.'),
      ('MESTR ALCEU', date '2026-05-20', 'MESTR ALCEU - salário ref abril - provisionamento', 5000.00, 'Planilha MODELO PGTO RVAL. Seção: PROVISIONAMENTO. Descrição: SALARIO REF ABRIL - CONFIRMAR VALOR. Verificar possível relação com lançamento anterior de R$ 6.000,00.'),
      ('TIAGO TANOS MARTINS', date '2026-05-20', 'TIAGO TANOS MARTINS - salário ref abril - provisionamento', 10000.00, 'Planilha MODELO PGTO RVAL. Seção: PROVISIONAMENTO. Descrição: SALARIO REF ABRIL. Verificar possível duplicidade/intenção de provisionamento.'),
      ('PEDRA Z', date '2026-05-15', 'PEDRA Z - retenção NF', 264.82, 'Planilha MODELO PGTO RVAL. Descrição: RETENÇÃO NF.')

      -- Observação:
      -- O lançamento B E D R$ 48,00 vencimento 30/05/2026 da planilha MODELO PGTO RVAL
      -- não foi incluído aqui porque já consta como BeD R$ 48,00 em emails - pgto - provisao.
  ) as t(credor_avulso, vencimento, descricao, valor, observacao)
)
insert into public.contas_pagar (
  descricao,
  credor_avulso,
  credor_pessoa_id,
  credor_empresa_id,
  obra_id,
  equipamento_id,
  origem,
  valor,
  vencimento,
  status,
  valor_pago,
  observacao,
  pagamento_direto_cliente
)
select
  d.descricao,
  d.credor_avulso,
  null,
  null,
  null,
  null,
  'avulso', -- Se der erro por CHECK CONSTRAINT no banco, substituir por 'outros'
  d.valor,
  d.vencimento,
  'a_vencer',
  0,
  d.observacao,
  false
from dados d
where not exists (
  select 1
  from public.contas_pagar cp
  where coalesce(cp.credor_avulso, '') = coalesce(d.credor_avulso, '')
    and cp.vencimento = d.vencimento
    and coalesce(cp.valor, 0) = d.valor
    and lower(coalesce(cp.descricao, '')) = lower(coalesce(d.descricao, ''))
);

commit;
