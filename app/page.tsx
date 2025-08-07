'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Clock, CalendarPlus } from "lucide-react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { createEvents } from "ics";
import { matches as rawMatches } from "./utils/data";


type Match = {
  id: string;
  date: Date;
  opponent: string;
  opponentLogo: string;
  hasValidTime?: boolean; // 👈 Ajout pour savoir si l’heure est valable
  link: string; // 👈 Ajout ici
};
const translations = {
  fr: {
    addCalendarTitle: "Ajouter tous les matchs à votre calendrier ?",
    appleOutlook: "📅 Apple / Outlook (.ics)",
    googleCalendar: "📆 Google Calendar",
    cancel: "Annuler",
    googleInstructions: [
      "✅ Le fichier a été téléchargé !",
      "Voici comment l'importer dans Google Calendar :",
      "1. Ouvrez Google Calendar",
      "2. Cliquez sur la roue crantée en haut à droite → Paramètres",
      "3. Allez dans Importer et exporter",
      "4. Sélectionnez le fichier téléchargé : jade_2526.ics",
      "5. Importez-le dans le calendrier de votre choix",
      "🎉 Tous les matchs de Jade sont maintenant dans votre agenda !",
    ],
    iosInstructions: [
      "✅ Le fichier a été téléchargé !",
      "Si pas déjà importer :",
      "1. Ouvrez l'application Fichiers",
      "2. Rendez-vous dans le dossier Téléchargements",
      "3. Appuyez sur le fichier jade_2526.ics",
      "4. Choisissez Ajouter à Calendrier si proposé",
      "📅 Tous les matchs de Jade sont maintenant ajoutés à votre calendrier !",
    ],
    close: "Fermer",
  }
};


const parsed = rawMatches.map((match, index) => {
  const [month, day, year] = match.dayLabel.split('/');

  const hourString = match.hourLabel || match["match.link"];
  let hour = NaN;
  let minute = NaN;

  if (hourString && /[:hH]/.test(hourString)) {
    [hour, minute] = hourString.split(/[:hH]/).map(Number);
  }

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    isNaN(hour) ? 0 : hour,
    isNaN(minute) ? 0 : minute
  );

  return {
    id: `${index}-${match["match.opponent"]}`,
    date,
    opponent: match["match.opponent"],
    opponentLogo: `${match["match.opponentLogo"]}`,
    link: match["match.link"]?.startsWith('http')
  ? match["match.link"]
  : match["match.link"]?.trim()
    ? `https://${match["match.link"]}`
    : null,
    hasValidTime: !isNaN(hour) && !isNaN(minute), // 👈 Ajout pour savoir si l’heure est valable
  };
});



export default function PhoenixSchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [showLocalTimes, setShowLocalTimes] = useState<{ [key: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showGoogleInstructions, setShowGoogleInstructions] = useState(false);
  const [showiOSInstructions, setShowiOSInstructions] = useState(false); 

  useEffect(() => {
    const now = new Date();
    const nowMinus5h = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const filtered = parsed
  .filter(match => match.date > nowMinus5h)
  .map(match => ({
    ...match,
    opponent: (match.opponent),
    link: match.link?.startsWith('http') ? match.link : `https://${match.link || 'youtube.com'}`,
  }));


    setMatches(filtered);
    setLoading(false);
  }, []);

 const generateICS = () => {
  const events = matches.map((match) => ({
    start: [
      match.date.getFullYear(),
      match.date.getMonth() + 1,
      match.date.getDate(),
      match.date.getHours(),
      match.date.getMinutes(),
    ] as [number, number, number, number, number],
    duration: { hours: 2 },
    title: `Match vs ${match.opponent}`,
    description: `Match contre ${match.opponent}`,
    location: 'US GAME',
    url: match.link || "https://goconqs.com/sports/2018/8/17/live-video.aspx"

  }));

  console.log("Events to create:", events);

  const { error, value } = createEvents(events as any);

  console.log("createEvents result:", { error, value });

  if (!error && value) {
    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lena_2526.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    console.error("Erreur ICS:", error);
  }
};

  const handleAppleOutlookImport = () => {
    generateICS(); // Télécharge le fichier .ics
    setShowiOSInstructions(true); // Affiche les instructions iOS
  };
  
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-72px)] -mt-16">
  <div className="relative w-72 h-80 overflow-hidden">
         <img
  src="/loader.jpg"
  alt="Chargement des matchs"
  className="absolute top-0 left-0 w-full h-full object-contain object-center"
  style={{ 
    clipPath: 'inset(0 100% 0 0)', 
    transform: 'scale(1)', 
    opacity: 1, 
    animation: 'reveal-image 2.5s ease-out forwards' 
  }}
/>

        </div>
        <style jsx>{`
          @keyframes reveal-image {
            0% {
              clip-path: inset(0 100% 0 0); /* Masque total de l'image de gauche à droite */
              transform: scale(1); /* Pas de redimensionnement */
              opacity: 1; /* L'image est visible mais masquée */
            }
            100% {
              clip-path: inset(0 0 0 0); /* L'image est complètement révélée */
              transform: scale(1); /* L'image conserve sa taille normale */
              opacity: 1; /* L'image reste visible */
            }
          }
  
          .animate-reveal-image {
            animation: reveal-image 2.5s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }
  const t = translations.fr;
  const handleGoogleCalendarImport = () => {
    generateICS();
    setShowGoogleInstructions(true);
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
  <ul className="space-y-4">
     {matches.map((match) => {
      const isLocal = showLocalTimes[match.id];

      const timeZone = isLocal
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'Europe/Paris';

     const locale = "fr-FR";


      const use12HourFormat = ['en-US', 'en-GB'].includes(locale);

      // Libellé du jour (ex : VENDREDI 15 NOVEMBRE)
      const dayLabel = new Date(match.date).toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone,
      }).toUpperCase();
    
    // Heure formatée selon locale
   const hourLabel = match.hasValidTime
  ? new Date(match.date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: use12HourFormat,
      timeZone,
    })
  : "?????";

    
    // Drapeau
    const flagCode = isLocal
      ? locale.split('-')[1]?.toLowerCase() || 'fr'
      : 'fr';
    
      return (
        <li key={match.id}>
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow rounded-xl">
            <CardHeader className="text-center border-b p-4">
              <p className="text-xl font-semibold text-gray-800 tracking-wide">
                {dayLabel}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between pl-6 pr-8 md:pl-16 md:pr-24 lg:pl-18 lg:pr-26 py-4">
              {/* Logo + Name */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-white  flex items-center justify-center overflow-hidden">
                  <img
                    src={match.opponentLogo}
                    alt={match.opponent}
                    className="object-contain w-10 h-10"
                  />
                </div>
                <p className="text-sm font-medium text-gray-900 max-w-[140px] break-words leading-tight">
  {match.opponent}
</p>
   </div>

              {/* Time box */}
              <div className="flex flex-col items-center text-sm text-gray-700 mt-1">
             <img
  src="https://flagcdn.com/w40/fr.png"
  alt="FR"
  className="w-5 h-4 mb-1"
/>



                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() =>
                    setShowLocalTimes((prev) => ({
                      ...prev,
                      [match.id]: !prev[match.id],
                    }))
                  }
                  title="Cliquez pour afficher l'heure locale"
                >
                  <Clock className="w-3 h-3" />
                 <span className="text-sm">{hourLabel}</span>

                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-purple-800 p-2 rounded-b-xl flex justify-center">
  <a
    href={match.link} // Assure-toi que match.link contient une URL valide
    target="_blank"
    rel="noopener noreferrer"
    className="text-base font-semibold text-white tracking-wide hover:underline"
  >
    MATCH DISPONIBLE ICI
  </a>
</CardFooter>



          </Card>
        </li>
      );
    })}
  </ul>
    {/* Floating Button */}
    <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-700 hover:bg-purple-800 text-white rounded-full p-4 shadow-lg z-50"
        title="Ajouter au calendrier"
      >
        <CalendarPlus className="w-6 h-6" />
      </button>

      {/* Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
  <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <DialogPanel className="bg-white rounded-xl p-6 pt-12 pb-4 max-w-sm mx-auto shadow-xl relative">
   

      {/* Modal Title */}
      <DialogTitle className="text-xl font-bold mb-2 text-center">
        {t.addCalendarTitle}
      </DialogTitle>

      {!showGoogleInstructions && !showiOSInstructions ? (
        <div className="flex flex-col gap-4 mt-4">
          <button
            onClick={handleAppleOutlookImport}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm"
          >
            {t.appleOutlook}
          </button>
          <button
            onClick={handleGoogleCalendarImport}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm"
          >
            {t.googleCalendar}
          </button>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-sm text-gray-500 mt-1"
          >
            {t.cancel}
          </button>
        </div>
      ) : showGoogleInstructions ? (
        <div className="space-y-3 text-center">
          {t.googleInstructions.map((instruction: string, index: number) => (
            <p key={index} className={index === 0 ? "text-green-600" : ""}>
              {instruction}
            </p>
          ))}
          <button
            onClick={() => {
              setIsModalOpen(false);
              setShowGoogleInstructions(false);
            }}
            className="mt-6 text-sm text-purple-700 font-semibold hover:underline"
          >
            {t.close}
          </button>
        </div>
      ) : (
        <div className="space-y-3 text-center">
          {t.iosInstructions.map((instruction: string, index: number) => (
            <p key={index} className={index === 0 ? "text-green-600" : ""}>
              {instruction}
            </p>
          ))}
          <button
            onClick={() => {
              setIsModalOpen(false);
              setShowiOSInstructions(false);
            }}
            className="mt-6 text-sm text-purple-700 font-semibold hover:underline"
          >
            {t.close}
          </button>
        </div>
      )}
    </DialogPanel>
  </div>
</Dialog>
</div>

  );
}
