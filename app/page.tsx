'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Clock, CalendarPlus, ExternalLink } from "lucide-react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { createEvents } from "ics";
import { matches as rawMatches } from "./utils/data";
import { DateTime } from "luxon";

type Match = {
  id: string;
  date: Date;
  opponent: string;
  opponentLogo: string;
  hasValidTime?: boolean;
  link: string;
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
      "4. Sélectionnez le fichier téléchargé : ines_2526.ics",
      "5. Importez-le dans le calendrier de votre choix",
      "🎉 Tous les matchs de Inès sont maintenant dans votre agenda !",
    ],
    iosInstructions: [
      "✅ Le fichier a été téléchargé !",
      "Si pas déjà importé :",
      "1. Ouvrez l'application Fichiers",
      "2. Rendez-vous dans le dossier Téléchargements",
      "3. Appuyez sur le fichier ines_2526.ics",
      "4. Choisissez Ajouter à Calendrier si proposé",
      "📅 Tous les matchs de Inès sont maintenant ajoutés à votre calendrier !",
    ],
    close: "Fermer",
  }
};

const parsed = rawMatches.map((match, index) => {
  const [month, day, year] = match.dayLabel.split('/');
  const hourString = match.hourLabel;
  let hour = NaN;
  let minute = NaN;

  if (hourString && /[:hH]/.test(hourString)) {
    [hour, minute] = hourString.split(/[:hH]/).map(Number);
  }

  // Création du datetime en Eastern Time
  const dtET = DateTime.fromObject(
    {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: isNaN(hour) ? 0 : hour,
      minute: isNaN(minute) ? 0 : minute,
    },
    { zone: "America/New_York" }
  );

  // Conversion en Europe/Paris (heure FR par défaut)
  const dtParis = dtET.setZone("Europe/Paris");

  return {
    id: `${index}-${match["match.opponent"]}`,
    date: dtParis.toJSDate(),
    opponent: match["match.opponent"],
    opponentLogo: `${match["match.opponentLogo"]}`,
    link: match["match.link"]?.startsWith('http')
      ? match["match.link"]
      : match["match.link"]?.trim()
      ? `https://${match["match.link"]}`
      : null,
    hasValidTime: !isNaN(hour) && !isNaN(minute),
  };
});

export default function PhoenixSchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showGoogleInstructions, setShowGoogleInstructions] = useState(false);
  const [showiOSInstructions, setShowiOSInstructions] = useState(false);
  const [userZone, setUserZone] = useState("Europe/Paris");
  const [userCountryCode, setUserCountryCode] = useState("fr");
  const [showLocalTimes, setShowLocalTimes] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    parsed.forEach(match => { initial[match.id] = true; });
    return initial;
  });
  const [isNoLinkModalOpen, setIsNoLinkModalOpen] = useState(false);

  // 🔹 Détection automatique du fuseau horaire et du pays
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserZone(tz);

    // Détection du pays selon la timezone
    let country = "fr";
    if (tz.startsWith("America")) country = "us";
    else if (tz.startsWith("Europe/")) country = "fr";
    else if (tz.startsWith("Asia")) country = "jp";
    setUserCountryCode(country);
  }, []);

  // 🔹 Filtrage des matchs à venir
  useEffect(() => {
    const now = new Date();
    const nowMinus5h = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const filtered = parsed
      .filter(match => match.date > nowMinus5h)
      .map(match => ({
        ...match,
        link: match.link?.startsWith('http')
          ? match.link
          : `https://${match.link || 'youtube.com'}`
      }));

    setMatches(filtered);
    setLoading(false);
  }, []);

  // 🔹 Génération du fichier .ics
  const generateICS = () => {
    const events = matches.map((match) => {
      const dt = DateTime.fromJSDate(match.date).setZone("Europe/Paris");
      return {
        start: [dt.year, dt.month, dt.day, dt.hour, dt.minute] as [number, number, number, number, number],
        duration: { hours: 2 },
        title: `Match vs ${match.opponent}`,
        description: `Match contre ${match.opponent}`,
        location: 'US GAME',
        url: match.link || "https://goconqs.com/sports/2018/8/17/live-video.aspx"
      };
    });

    const { error, value } = createEvents(events as any);
    if (!error && value) {
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ines_2526.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleAppleOutlookImport = () => {
    generateICS();
    setShowiOSInstructions(true);
  };

  const handleGoogleCalendarImport = () => {
    generateICS();
    setShowGoogleInstructions(true);
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
            0% { clip-path: inset(0 100% 0 0); }
            100% { clip-path: inset(0 0 0 0); }
          }
        `}</style>
      </div>
    );
  }

  const t = translations.fr;

  return (
    <div className="mx-auto pb-20">
      {/* En-tête stylisé */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-blue-200">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">RI</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              SAISON 2025-2026
            </h1>
            <p className="text-blue-600 text-sm font-medium">Rhode Island Basketball</p>
          </div>
        </div>
      </div>

      {/* Liste des matchs */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] p-4">
        {matches.map((match) => {
          const isLocal = showLocalTimes[match.id];
          const timeZone = isLocal ? userZone : "Europe/Paris";
          const locale = "fr-FR";
          const use12HourFormat = ['en-US', 'en-GB'].includes(locale);

          const dayLabel = new Date(match.date).toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone,
          }).toUpperCase();

          const hourLabel = match.hasValidTime
            ? new Date(match.date).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: use12HourFormat,
                timeZone,
              })
            : "?????";

          const flagCode = isLocal ? userCountryCode : "fr";

          return (
            <div key={match.id} className="group">
              <Card className="bg-white/90 backdrop-blur-sm border-2 border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:border-blue-300">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 text-center">
                  <p className="text-lg font-bold tracking-wider drop-shadow-sm">{dayLabel}</p>
                </CardHeader>

                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    {/* Équipe adverse */}
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-16 h-16 bg-white rounded-xl shadow-md border border-blue-100 flex items-center justify-center p-2">
                        <img
                          src={match.opponentLogo}
                          alt={match.opponent}
                          className="object-contain w-12 h-12"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-blue-900 leading-tight">
                          {match.opponent}
                        </p>
                      </div>
                    </div>

                    {/* Heure + drapeau dynamique */}
                    <div className="flex flex-col items-center ml-4">
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={`https://flagcdn.com/w40/${flagCode}.png`}
                          alt="Flag"
                          className="w-6 h-4 rounded"
                        />
                      </div>
                      <div
                        className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200"
                        onClick={() =>
                          setShowLocalTimes((prev) => ({
                            ...prev,
                            [match.id]: !prev[match.id],
                          }))
                        }
                        title="Cliquez pour changer le fuseau horaire"
                      >
                        <Clock className="w-4 h-4 text-blue-800" />
                        <span className="font-bold text-blue-800 text-sm">{hourLabel}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-gradient-to-r from-blue-700 to-blue-600 p-0">
                  {match.link && !match.link.includes("youtube.com") ? (
                    <a
                      href={match.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center py-3 text-white font-bold text-lg hover:bg-blue-700/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      REGARDER LE MATCH
                    </a>
                  ) : (
                    <button
                      onClick={() => setIsNoLinkModalOpen(true)}
                      className="w-full text-center py-3 text-white font-bold text-lg hover:bg-blue-700/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      REGARDER LE MATCH
                    </button>
                  )}
                </CardFooter>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Bouton flottant */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full p-4 shadow-2xl z-50 transition-all duration-300 hover:scale-110"
        title="Ajouter au calendrier"
      >
        <CalendarPlus className="w-6 h-6" />
      </button>

      {/* Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-2xl p-6 max-w-sm mx-auto shadow-2xl border border-blue-200">
            <DialogTitle className="text-xl font-bold text-blue-900 mb-4 text-center">
              {t.addCalendarTitle}
            </DialogTitle>

            {!showGoogleInstructions && !showiOSInstructions ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAppleOutlookImport}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 px-4 py-3 rounded-xl text-sm font-medium transition-colors border border-blue-200"
                >
                  {t.appleOutlook}
                </button>
                <button
                  onClick={handleGoogleCalendarImport}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 px-4 py-3 rounded-xl text-sm font-medium transition-colors border border-blue-200"
                >
                  {t.googleCalendar}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                >
                  {t.cancel}
                </button>
              </div>
            ) : showGoogleInstructions ? (
              <div className="space-y-3 text-center">
                {t.googleInstructions.map((instruction, index) => (
                  <p key={index} className={index === 0 ? "text-green-600 font-semibold" : "text-blue-800 text-sm"}>
                    {instruction}
                  </p>
                ))}
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowGoogleInstructions(false);
                  }}
                  className="mt-4 text-sm text-blue-700 font-semibold hover:text-blue-900"
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                {t.iosInstructions.map((instruction, index) => (
                  <p key={index} className={index === 0 ? "text-green-600 font-semibold" : "text-blue-800 text-sm"}>
                    {instruction}
                  </p>
                ))}
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowiOSInstructions(false);
                  }}
                  className="mt-4 text-sm text-blue-700 font-semibold hover:text-blue-900"
                >
                  {t.close}
                </button>
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modale spéciale "pas de lien" */}
<Dialog open={isNoLinkModalOpen} onClose={() => setIsNoLinkModalOpen(false)} className="relative z-50">
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <DialogPanel className="bg-white rounded-2xl p-6 max-w-sm mx-auto shadow-2xl border border-blue-200">
      <DialogTitle className="text-xl font-bold text-blue-900 mb-3 text-center">
        Inès s’échauffe en dehors des projecteurs ✨
      </DialogTitle>
      <p className="text-blue-700 text-center mb-6 text-sm">
        Ce match n’a pas encore de lien vidéo disponible. Reviens un peu plus tard, la diffusion sera ajoutée dès qu’elle sera prête !
      </p>
      <button
        onClick={() => setIsNoLinkModalOpen(false)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-semibold transition-colors"
      >
        Fermer
      </button>
    </DialogPanel>
  </div>
</Dialog>

    </div>
  );
}