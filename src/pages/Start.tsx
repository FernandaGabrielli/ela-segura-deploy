import backgroundImage from "../components/background.png";
// CORREÇÃO: Importando a logo do mesmo diretório de componentes
import logoImage from "../components/logo.png";

interface StartProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function Start({ onLogin, onRegister }: StartProps) {
  return (
    <div className="w-full h-screen bg-white overflow-hidden relative">
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#5d5fef]/40 to-[#5d5fef]" />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-end items-center px-6 pb-14">
        
        {/* Bloco da Logo Centralizada e Enquadrada */}
        <div className="flex items-center justify-center mb-10 w-full max-w-[240px]">
          <img 
            src={logoImage} 
            alt="Ela Segura Logo" 
            className="w-full h-auto object-contain"
          />
        </div>

        <button
          onClick={onLogin}
          className="w-full bg-white text-[#5d5fef] font-medium py-3 rounded-md mb-4 hover:bg-gray-100 transition"
        >
          Entrar
        </button>

        <button
          onClick={onRegister}
          className="w-full bg-white text-pink-500 font-medium py-3 rounded-md hover:bg-gray-100 transition"
        >
          Cadastrar
        </button>
      </div>
    </div>
  );
}