export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface border-t border-gray-200 py-4 mt-auto">
      <div className="w-full px-6 flex flex-col md:flex-row items-center justify-between text-xs text-text-muted">
        <p>
          &copy; {currentYear}{" "}
          <span className="font-semibold text-text-main">
            Villarreal-Romero
          </span>
          . Todos los derechos reservados.
        </p>
        <p className="mt-2 md:mt-0">
          Diseñado y desarrollado por{" "}
          <span className="font-semibold text-primary">
            Tecnoingeniería B.O.
          </span>
        </p>
      </div>
    </footer>
  );
};
