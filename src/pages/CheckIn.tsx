import { useState, useEffect } from "react";
import { ArrowLeft, Check, MapPin, Clock3, Users, Navigation } from "lucide-react";
import BottomTab from "../components/Bottomtab";

interface CheckInProps {
  onBack: () => void;
  onConfirm: (payload: { destino: string; tempo: string; contatos: string[]; lat?: number; lng?: number }) => void;
  onEmergency: () => void;
}

interface ContatoData {
  id: string;
  nome: string;
  telefone: string;
}

export default function CheckIn({ onBack, onConfirm, onEmergency }: CheckInProps) {
  const [destination, setDestination] = useState("");
  const [selectedTime, setSelectedTime] = useState("1 hora");
  const [contactList, setContactList] = useState<ContatoData[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [sendingCheckin, setSendingCheckin] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Simula o carregamento de contatos locais (mocked)
  useEffect(() => {
    const timer = setTimeout(() => {
      setContactList([
        { id: "c1", nome: "Mãe", telefone: "(81) 9 8888-7777" },
        { id: "c2", nome: "João", telefone: "(81) 9 1234-6789" },
        { id: "c3", nome: "Irmã", telefone: "(81) 9 9999-8888" }
      ]);
      setLoadingContacts(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Captura a geolocalização nativa do navegador e converte em endereço legível
  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) return;

    setLoadingLocation(true);
    setDestination("Carregando localização...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&namedetails=1`
          );
          const data = await res.json();
          const addr = data.address || {};

          // Nome do local (ex: "Shopping Recife", "Parque da Jaqueira")
          const nomeLocal =
            data.namedetails?.name ||
            addr.shop ||
            addr.amenity ||
            addr.leisure ||
            addr.tourism ||
            addr.building ||
            "";

          const rua = addr.road || "";
          const bairro =
            addr.suburb || addr.neighbourhood || addr.city_district || "";
          const cidade = addr.city || addr.town || addr.municipality || "";

          // Se identificou um nome de local (POI), usa ele + bairro/cidade
          // Caso contrário, monta endereço com rua + bairro + cidade
          const partes = nomeLocal
            ? [nomeLocal, bairro || cidade].filter(Boolean)
            : [rua, bairro, cidade].filter(Boolean);

          const enderecoLegivel = partes.length > 0
            ? partes.join(", ")
            : `Localização atual (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

          setDestination(enderecoLegivel);
        } catch (err) {
          console.error("Erro ao buscar endereço:", err);
          setDestination(`Localização atual (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        setDestination("Recife, PE (Localização Mockada)");
        setCoords({ lat: -8.05428, lng: -34.8813 });
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  // Processa a confirmação localmente sem disparar requisições HTTP
  const handleConfirmCheckIn = () => {
    setSendingCheckin(true);

    setTimeout(() => {
      setSendingCheckin(false);
      localStorage.removeItem("checkin_segundos_restantes");

      onConfirm({
        destino: destination,
        tempo: selectedTime,
        contatos: selectedContacts,
        lat: coords.lat || -8.05428,
        lng: coords.lng || -34.8813
      });
    }, 600);
  };

  const times = ["15 min", "30 min", "1 hora", "2 horas"];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      <div className="flex-1 px-6 pt-12 pb-6 overflow-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl border bg-white flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-indigo-500">Check-in de Segurança</h1>
        </div>
        <p className="text-gray-400 mt-4">Avise seus contatos quando estiver a caminho de um local</p>

        {/* Destino */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 mt-5 mb-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-purple-500" />
            <span className="font-medium text-gray-700">Local de Destino</span>
          </div>
          <input
            type="text"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              if (coords.lat) setCoords({});
            }}
            placeholder="Buscar endereço..."
            className="w-full bg-gray-100 rounded-xl p-4 outline-none text-sm text-gray-700 focus:bg-gray-50 border border-transparent focus:border-purple-300 transition-all"
          />
          <button
            onClick={handleUseCurrentLocation}
            disabled={loadingLocation}
            className="flex items-center gap-2 mt-4 text-sm text-indigo-500 font-semibold hover:text-purple-600 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Navigation size={16} className={loadingLocation ? "animate-spin" : ""} />
            {loadingLocation ? "Localizando..." : "Usar localização atual"}
          </button>
        </div>

        {/* Contatos Dinâmicos */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-purple-500" />
            <span className="font-medium text-gray-700">Contatos Vinculados</span>
          </div>
          <div className="space-y-3">
            {loadingContacts ? (
              <p className="text-xs text-gray-400 animate-pulse">Sincronizando seus contatos...</p>
            ) : (
              contactList.map((contact) => (
                <Contact
                  key={contact.id}
                  name={contact.nome}
                  phone={contact.telefone}
                  selected={selectedContacts.includes(contact.id)}
                  onClick={() => toggleContact(contact.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Tempo */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Clock3 size={18} className="text-purple-500" />
            <span className="font-medium text-gray-700">Avisar se eu não chegar em:</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {times.map((time) => (
              <TimeButton
                key={time}
                text={time}
                active={selectedTime === time}
                onClick={() => setSelectedTime(time)}
              />
            ))}
          </div>
        </div>

        {/* Botão de Confirmação Conectado */}
        <button
          onClick={handleConfirmCheckIn}
          disabled={!destination || selectedContacts.length === 0 || sendingCheckin}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-medium mt-8 mb-8 active:scale-[0.99] transition-transform shadow-md shadow-indigo-100"
        >
          {sendingCheckin ? "Processando Check-in..." : "Confirmar Check-in"}
        </button>
      </div>

      <BottomTab
        currentScreen="checkin"
        onMap={onBack}
        onEmergency={onEmergency}
        onCheckIn={() => {}}
      />
    </div>
  );
}

function Contact({ name, phone, selected, onClick }: { name: string; phone: string; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 flex items-center gap-3 border cursor-pointer transition-all active:scale-[0.99] ${
        selected ? "border-purple-500 bg-purple-50/60" : "bg-gray-50 border-transparent hover:bg-gray-100"
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
        selected ? "bg-purple-500 text-white" : "bg-gray-300"
      }`}>
        {selected && <Check size={14} />}
      </div>
      <div>
        <h4 className="font-medium text-gray-700 text-sm">{name}</h4>
        <p className="text-xs text-gray-400 mt-0.5">{phone}</p>
      </div>
    </div>
  );
}

function TimeButton({ text, active, onClick }: { text: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-3 border font-medium text-sm transition-all active:scale-95 ${
        active ? "border-purple-500 bg-purple-100 text-purple-700 shadow-xs" : "bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200"
      }`}
    >
      {text}
    </button>
  );
}