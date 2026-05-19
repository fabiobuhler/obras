import { Activity, Users, Building2, Wallet } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { title: 'Obras Ativas', value: '12', icon: Building2, color: 'text-blue-500' },
    { title: 'Funcionários', value: '145', icon: Users, color: 'text-green-500' },
    { title: 'Custos do Mês', value: 'R$ 1.250.000', icon: Wallet, color: 'text-red-500' },
    { title: 'Produtividade', value: '89%', icon: Activity, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
              <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico/Tabela de exemplo futura */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Gráfico de Custos Mensais (Em breve)</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Evolução Físico-Financeira (Em breve)</p>
        </div>
      </div>
    </div>
  );
}
