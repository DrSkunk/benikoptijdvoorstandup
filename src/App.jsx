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

  const timeout = useRef(null);

  function update() {
    const now = new Date();
    setTime(now);
    const standupTime = new Date(now);
    // on monday, wednesday, friday it is 9AM
    standupTime.setHours(9, 1, 0, 0);
    // on tuesday, thursday it is 10AM
    // on weekends there is no standup
    if (now.getDay() === 2 || now.getDay() === 4) {
      standupTime.setHours(10, 1, 0, 0);
    }
    setIsStandupDay(now.getDay() > 0 && now.getDay() < 6);
    setIsTooLate(now > standupTime);
    const msUntilNextSecond = 1000 - now.getMilliseconds();

    timeout.current = setTimeout(() => {
      update();
    }, msUntilNextSecond);
  }

  useEffect(() => {
    update();

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  const formattedTime = time.toLocaleTimeString("nl-BE");

  if (!isStandupDay) {
    <div>Geen Standup vandaag. Raak wat gras aan</div>;
  }

  return (
    <div className="flex flex-col w-screen h-screen justify-center items-center">
      <div
        className={classNames(
          "font-mono text-9xl",
          isTooLate && "text-red-500"
        )}
      >
        {formattedTime}
      </div>
      {isTooLate && <MemoizedParticles />}
    </div>
  );
}
