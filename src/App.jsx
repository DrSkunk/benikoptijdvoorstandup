import React, { useState, useEffect, useRef } from "react";
import { ParticlesComp } from "./Particles";

const MemoizedParticles = React.memo(ParticlesComp);

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function App() {
  const [time, setTime] = useState(new Date());
  const [isTooLate, setIsTooLate] = useState(false);
  const [isStandupDay, setIsStandupDay] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [elapsedTime, setElapsedTime] = useState("");
  const [formattedStandupTime, setFormattedStandupTime] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  // Using any type to avoid type errors with setTimeout
  const timeout = useRef(undefined);

  // Function to request notification permission
  function requestNotificationPermission() {
    if (!("Notification" in window)) {
      alert("Deze browser ondersteunt geen notificaties");
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        setNotificationsEnabled(true);
      }
    });
  }

  // Function to send notification
  function sendNotification() {
    if (notificationsEnabled && !notificationSent) {
      new Notification("Standup herinnering", {
        body: `De standup begint over 1 minuut (${formattedStandupTime})`,
        icon: "/favicon.svg",
      });

      setNotificationSent(true);

      // Reset notification flag for the next day
      setTimeout(() => {
        setNotificationSent(false);
      }, 24 * 60 * 60 * 1000); // Reset after 24 hours
    }
  }

  function update() {
    const now = new Date();
    setTime(now);
    const standupTime = new Date(now);
    // on monday, wednesday, friday it is 9AM
    standupTime.setHours(9, 1, 0, 0);
    // on tuesday, thursday it is 10AM
    // on weekends there is no standup
    // Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 2 || dayOfWeek === 4) {
      // Tuesday or Thursday
      standupTime.setHours(10, 1, 0, 0);
    }
    setIsStandupDay(dayOfWeek > 0 && dayOfWeek < 6);

    // Calculate late status first
    const isLate = now > standupTime;
    setIsTooLate(isLate);

    // Calculate remaining time or elapsed time
    const timeDiffMs = isLate
      ? now.getTime() - standupTime.getTime()
      : standupTime.getTime() - now.getTime();

    const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiffMs % (1000 * 60)) / 1000);

    // Format time difference as HH:MM:SS
    const formattedDiff = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // Format the standup time for display
    const standupHour = standupTime.getHours();
    const standupTimeFormatted = `${standupHour}:00`;
    setFormattedStandupTime(standupTimeFormatted);

    if (isLate) {
      setElapsedTime(formattedDiff);
      setRemainingTime("");
    } else {
      setRemainingTime(formattedDiff);
      setElapsedTime("");

      // Check if it's time to send a notification (1 minute before standup)
      if (
        notificationsEnabled &&
        isStandupDay &&
        !notificationSent &&
        minutes === 1 &&
        hours === 0 &&
        seconds === 0
      ) {
        sendNotification();
      }
    }

    const msUntilNextSecond = 1000 - now.getMilliseconds();

    // Work around type checking by using JS object property assignment
    // @ts-ignore
    timeout.current = setTimeout(() => {
      update();
    }, msUntilNextSecond);
  }

  useEffect(() => {
    update();

    // Check if notifications were previously allowed
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }

    return () => {
      clearTimeout(timeout.current);
    };
    // We intentionally exclude update from dependencies to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedTime = time.toLocaleTimeString("nl-BE");

  return (
    <div className="flex flex-col w-screen h-screen justify-center items-center relative">
      {/* Notification button in the upper right corner */}
      <button
        onClick={requestNotificationPermission}
        className={classNames(
          "absolute top-4 right-4 px-4 py-2 rounded-full",
          notificationsEnabled
            ? "bg-green-500 text-white"
            : "bg-gray-300 hover:bg-gray-400 text-gray-800"
        )}
      >
        {notificationsEnabled ? "Notificaties aan" : "Notificaties aanzetten"}
      </button>

      <div
        className={classNames(
          "font-mono text-9xl",
          isTooLate && "text-red-500"
        )}
      >
        {formattedTime}
      </div>

      {!isStandupDay ? (
        <div className="font-mono text-4xl mt-4 text-blue-500">
          Geen Standup vandaag. Raak wat gras aan 🌿
        </div>
      ) : (
        <div
          className={classNames(
            "font-mono text-4xl mt-4",
            isTooLate ? "text-red-500" : "text-green-500"
          )}
        >
          {isTooLate
            ? `Standup is bezig: ${elapsedTime} geleden begonnen`
            : `Tijd tot standup (${formattedStandupTime}): ${remainingTime}`}
        </div>
      )}

      {isTooLate && isStandupDay && <MemoizedParticles />}
    </div>
  );
}
