import { ButtonImprimir, ButtonRelatorio } from './ActionButtons';

export function PageHeader({ title, description, actions, showReport = true, showPrint = true, onPrintClick, onReportClick }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
        {description && <p className="text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showPrint && <ButtonImprimir onClick={onPrintClick || (() => {})} />}
        {showReport && <ButtonRelatorio onClick={onReportClick || (() => {})} />}
        {actions}
      </div>
    </div>
  );
}
