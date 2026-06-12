import { useState, useEffect } from "react";
import { AlertTriangle, List, LocateFixed } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import BottomTab from "../components/Bottomtab";
import "leaflet/dist/leaflet.css";

interface MapSafeProps {
  onMenu: () => void;
  onEmergency: () => void;
  onCheckIn: () => void;
  onProfile: () => void;
}

interface DenunciaData {
  id: string;
  tipo: string;
  bairro: string;
  status: string;
  latitude: number;
  longitude: number;
  descricao: string;
}

// Sub-componente para redefinir o centro do mapa quando o usuário clica no GPS
function ChangeMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function MapSafe({ onMenu, onEmergency, onCheckIn, onProfile }: MapSafeProps) {
  // Centro inicial padrão (Boa Viagem, Recife)
  const [userLocation, setUserLocation] = useState<[number, number]>([-8.1146, -34.9004]);
  const [denuncias, setDenuncias] = useState<DenunciaData[]>([]);
  const [proximaDeRisco, setProximaDeRisco] = useState(false);

  // 1. Unifica os dados estáticos do Seed com as denúncias criadas localmente no localStorage
  useEffect(() => {
    const pontosSeed: DenunciaData[] = [
      // --- RECIFE: ZONA SUL ---
      { id: "1", tipo: 'assedio', bairro: 'Boa Viagem', latitude: -8.1146, longitude: -34.9004, status: 'pendente', descricao: 'Assédio verbal próximo à Av. Conselheiro Aguiar.' },
      { id: "2", tipo: 'perseguicao', bairro: 'Boa Viagem', latitude: -8.1312, longitude: -34.9042, status: 'em_analise', descricao: 'Pedestre seguida por carro nas imediações do Parque Dona Lindu.' },
      { id: "3", tipo: 'violencia_fisica', bairro: 'Pina', latitude: -8.0894, longitude: -34.8812, status: 'resolvido', descricao: 'Abordagem violenta na faixa de terra próximo ao contraturno escolar.' },
      { id: "4", tipo: 'outro', bairro: 'Pina', latitude: -8.0981, longitude: -34.8875, status: 'pendente', descricao: 'Parada de ônibus completamente escura com quebra de lâmpada.' },
      { id: "5", tipo: 'assedio', bairro: 'Imbiribeira', latitude: -8.1025, longitude: -34.9181, status: 'em_analise', descricao: 'Importunação ofensiva próximo à passarela da estação de metrô.' },
      { id: "6", tipo: 'perseguicao', bairro: 'Ibura', latitude: -8.1215, longitude: -34.9452, status: 'resolvido', descricao: 'Relato de perseguição em beco residencial na UR-02.' },

      // --- RECIFE: ZONA OESTE ---
      { id: "7", tipo: 'perseguicao', bairro: 'Várzea', latitude: -8.0470, longitude: -34.9525, status: 'pendente', descricao: 'Relato de perseguição perto do campus da UFPE.' },
      { id: "8", tipo: 'assedio', bairro: 'Cordeiro', latitude: -8.0482, longitude: -34.9254, status: 'em_analise', descricao: 'Abordagem agressiva na Av. Caxangá.' },
      { id: "9", tipo: 'violencia_fisica', bairro: 'Afogados', latitude: -8.0772, longitude: -34.9125, status: 'resolvido', descricao: 'Tentativa de assalto com agressão física próximo ao mercado público.' },
      { id: "10", tipo: 'outro', bairro: 'Areias', latitude: -8.0864, longitude: -34.9312, status: 'pendente', descricao: 'Ponto de descarte de lixo entulhado bloqueando passagem de pedestres.' },

      // --- RECIFE: CENTRO ---
      { id: "21", tipo: 'violencia_fisica', bairro: 'Recife Antigo', latitude: -8.0631, longitude: -34.8711, status: 'resolvido', descricao: 'Agressão registrada em rua deserta após as 22h.' },
      
      // --- OLINDA ---
      { id: "26", tipo: 'assedio', bairro: 'Sítio Histórico de Olinda', latitude: -8.0142, longitude: -34.8514, status: 'em_analise', descricao: 'Importunação em via pública perto da Sé.' },
      
      // --- JABOATÃO DOS GUARARAPES ---
      { id: "31", tipo: 'outro', bairro: 'Piedade', latitude: -8.1633, longitude: -34.9152, status: 'pendente', descricao: 'Iluminação pública precária gerando sensação de segurança.' }
    ];

    // Busca dados inseridos dinamicamente pela aba "Reportar Incidente"
    const locaisSalvos = localStorage.getItem("mock_denuncias");
    if (locaisSalvos) {
      try {
        const denunciasLocais = JSON.parse(locaisSalvos);
        
        // Mapeia e garante que pins locais sem coordenadas fixas apareçam próximos à usuária
        const normaisLocais = denunciasLocales.map((d: any) => ({
          id: d.id,
          tipo: d.tipo,
          bairro: d.bairro,
          status: d.status,
          latitude: d.latitude || userLocation[0] + (Math.random() - 0.5) * 0.01,
          longitude: d.longitude || userLocation[1] + (Math.random() - 0.5) * 0.01,
          descricao: d.descricao
        }));

        setDenuncias([...normaisLocais, ...pontosSeed]);
      } catch (e) {
        setDenuncias(pontosSeed);
      }
    } else {
      setDenuncias(pontosSeed);
    }
  }, [userLocation]); // Re-executa se a posição base mudar para alinhar novos pins locais

  // 2. Captura a geolocalização real do celular da usuária
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Erro ao obter GPS:", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // 3. Verifica se alguma área de risco está a menos de ~500 metros da usuária
  useEffect(() => {
    if (denuncias.length === 0) return;

    const detectaRisco = denuncias.some((d) => {
      const dist = calcularDistancia(userLocation[0], userLocation[1], d.latitude, d.longitude);
      return dist < 0.5; // Menos de 500 metros
    });
    setProximaDeRisco(detectaRisco);
  }, [userLocation, denuncias]);

  function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  const obterCorRisco = (status: string) => {
    if (status === "pendente") return "#ef4444";
    if (status === "em_analise") return "#ec4899";
    return "#fbbf24";
  };

  const resetarParaGpsAtual = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

  return (
    <div className="relative h-screen w-full bg-gray-100 flex flex-col justify-between overflow-hidden">
      
      {/* 1. MAPA INTERATIVO REAL (LEAFLET) */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={userLocation} 
          zoom={14} 
          className="h-full w-full" 
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <ChangeMapCenter center={userLocation} />

          {/* Marcador azul da posição real da usuária */}
          <CircleMarker center={userLocation} radius={10} pathOptions={{ color: '#5d5fef', fillColor: '#3b82f6', fillOpacity: 0.6 }}>
            <Popup><span className="font-semibold text-xs">Você está aqui</span></Popup>
          </CircleMarker>

          {/* Renderização dinâmica dos marcadores (Seed + Cadastrados locais) */}
          {denuncias.map((denuncia) => (
            <CircleMarker
              key={denuncia.id}
              center={[denuncia.latitude, denuncia.longitude]}
              radius={22}
              pathOptions={{
                color: obterCorRisco(denuncia.status),
                fillColor: obterCorRisco(denuncia.status),
                fillOpacity: 0.25,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-1 max-w-xs">
                  <h4 className="font-bold text-gray-800 capitalize text-sm">{denuncia.tipo.replace('_', ' ')}</h4>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Bairro: {denuncia.bairro}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{denuncia.descricao}</p>
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-bold inline-block mt-2 uppercase text-gray-600">
                    Status: {denuncia.status}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* 2. TOP OVERLAYS */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex flex-col gap-4">
        <button 
          onClick={onMenu}
          className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center active:scale-95 transition-transform"
        >
          <List size={22} className="text-purple-600" />
        </button>

        {proximaDeRisco && (
          <div className="w-full bg-[#FF3B5C] text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center gap-3 mt-2 animate-bounce">
            <AlertTriangle size={18} className="shrink-0" />
            <span className="font-medium text-sm">Cuidado! Área de risco próxima</span>
          </div>
        )}
      </div>

      {/* 3. FLOATING WIDGETS */}
      <div className="absolute bottom-24 left-6 right-6 z-10 flex items-end justify-between pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xs p-4 rounded-3xl shadow-xl w-32 pointer-events-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Risco</span>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full" /><span className="text-xs text-gray-600 font-medium">Alto</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-pink-500 rounded-full" /><span className="text-xs text-gray-600 font-medium">Médio</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-400 rounded-full" /><span className="text-xs text-gray-600 font-medium">Baixo</span></div>
          </div>
        </div>

        <button 
          onClick={resetarParaGpsAtual}
          className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-purple-600 active:scale-95 transition-transform pointer-events-auto"
        >
          <LocateFixed size={22} />
        </button>
      </div>

      {/* 4. BOTTOM NAVIGATION */}
      <div className="mt-auto w-full z-10">
        <BottomTab 
          currentScreen="map"
          onMap={() => {}} 
          onEmergency={onEmergency}
          onCheckIn={onCheckIn}
        />
      </div>
    </div>
  );
}