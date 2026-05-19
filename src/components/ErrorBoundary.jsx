import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ERRO FATAL DE RENDERIZAÇÃO:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    localStorage.removeItem('theme');
    window.location.reload();
  };

  handleClearSession = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background p-6 text-foreground flex items-center justify-center">
          <div className="mx-auto max-w-3xl w-full rounded-xl border border-red-300 bg-card p-6 shadow-sm dark:border-red-900/60">
            <h1 className="text-xl font-semibold text-red-600 dark:text-red-300">
              Erro ao carregar o sistema
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Ocorreu um erro de renderização. A tela branca foi interceptada para facilitar o diagnóstico.
            </p>

            <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-muted p-4 text-xs text-foreground">
              {String(this.state.error?.message || this.state.error || 'Erro desconhecido')}
            </pre>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Recarregar
              </button>

              <button
                type="button"
                onClick={this.handleClearSession}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Limpar sessão e voltar ao login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
