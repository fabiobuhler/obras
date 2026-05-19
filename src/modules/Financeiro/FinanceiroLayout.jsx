import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  {
    label: 'Contas a Pagar',
    to: '/financeiro/contas-pagar',
  },
  {
    label: 'Contas Pagas',
    to: '/financeiro/contas-pagas',
  },
  {
    label: 'Contas FAT',
    to: '/financeiro/contas-fat',
  },
];

export default function FinanceiroLayout() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">
          Financeiro
        </h1>
        <p className="text-sm text-muted-foreground">
          Controle de contas a pagar, contas pagas e pagamentos diretos do cliente ao fornecedor.
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-max rounded-lg border border-border bg-card p-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
