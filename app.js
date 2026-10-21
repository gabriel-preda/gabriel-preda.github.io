"use strict";

(() => {
  const byId = (id) => document.getElementById(id);
  const deck = byId("deck");
  const haltScreen = byId("halt-screen");
  const keypad = document.querySelector(".deck__keypad");
  const terminalView = byId("view-terminal");
  const terminalInput = byId("cmd-input");
  const terminalForm = document.querySelector(".term-prompt");
  const termLog = byId("term-log");
  const manualKey = byId("key-manual");
  const errorCounter = byId("err-counter");
  const views = new Map(
    [...document.querySelectorAll(".screen-view")].map((view) => [
      view.id.replace(/^view-/, ""),
      view,
    ]),
  );
  const keys = new Map(
    [...keypad.querySelectorAll(".hw-key[data-target]")].map((key) => [
      key.dataset.target,
      key,
    ]),
  );
  const requiredElements = [
    deck,
    haltScreen,
    keypad,
    terminalView,
    terminalInput,
    terminalForm,
    termLog,
    manualKey,
    errorCounter,
  ];

  if (requiredElements.some((element) => !element)) {
    throw new Error("The page is missing an element required by app.js.");
  }

  if (views.size === 0 || views.size !== keys.size || [...views.keys()].some((name) => !keys.has(name))) {
    throw new Error("Every screen view must have exactly one navigation key.");
  }

  const githubUrl = "https://github.com/gabriel-preda";
  const commandResponses = new Map([
    ["ping", "64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=-12.4 ms (Causality violation detected)."],
    ["traceroute", "1  router.local (192.168.1.1)  0.4ms\n 2  isp-gateway  4.2ms\n 3  black-hole.space  * * * (The packet got lost in the network)."],
    ["sudo", "User is not in the sudoers file. The administrator has been notified."],
    ["sudo rm -rf /", "Kernel Guard: Nice try. All partitions are mounted read-only for visitors."],
    ["rm -rf /", "Kernel Guard: Nice try. All partitions are mounted read-only for visitors."],
    ["coffee", "HTTP 418: I'm a teapot. The caffeine subsystem requires manual hardware intervention."],
    ["uptime", "System up 99.998% — powered exclusively by coffee and ICMP packets."],
    ["whoami", "guest@browser — local IP address recorded in volatile memory."],
  ]);
  const quoteText = byId("quote-text");
  const quoteAttribution = document.querySelector(".quote-card__attribution");
  const quoteCountdown = byId("quote-countdown");
  const quotes = [
    {
      text: "“It’s not a bug. It’s an undocumented feature.”",
      attribution: "— Anyone who wrote a line of code in production",
    },
    {
      text: "“We rebooted the server, but the feature was still undocumented.”",
      attribution: "— Anyone who wrote a line of code in production",
    },
  ];


  if (!quoteText || !quoteAttribution || !quoteCountdown) {
    throw new Error("The page is missing a quote section element.");
  }

  let errorCount = 0;
  let errorTimer;
  let quoteTimer;

  function addUtcMonths(date, monthCount) {
    const monthIndex = date.getUTCFullYear() * 12 + date.getUTCMonth() + monthCount;
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    return new Date(Date.UTC(
      year,
      month,
      Math.min(date.getUTCDate(), lastDay),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ));
  }

  function switchView(target) {
    const selectedView = views.get(target);
    if (!selectedView) {
      return;
    }

    views.forEach((view, name) => {
      const active = name === target;
      view.hidden = !active;
      keys.get(name).classList.toggle("is-active", active);

      if (active) {
        keys.get(name).setAttribute("aria-current", "page");
      } else {
        keys.get(name).removeAttribute("aria-current");
      }
    });

    if (target === "manual") {
      manualKey.classList.remove("hw-key--alert");
    } else if (target === "terminal") {
      terminalInput.focus();
    }
  }

  function printToLog(command, response, isError = false) {
    if (command) {
      const commandLine = document.createElement("p");
      commandLine.className = "term-line term-line--command";
      commandLine.textContent = `root@node1:~# ${command}`;
      termLog.append(commandLine);
    }

    if (response) {
      const responseLine = document.createElement("p");
      responseLine.className = isError ? "term-line term-line--error" : "term-line";
      responseLine.textContent = response;
      termLog.append(responseLine);
    }

    termLog.scrollTop = termLog.scrollHeight;
  }

  function showCommandError(command) {
    errorCount += 1;
    errorCounter.textContent = String(errorCount);
    window.clearTimeout(errorTimer);
    terminalForm.classList.remove("input-error");
    void terminalForm.offsetWidth;
    terminalForm.classList.add("input-error");
    errorTimer = window.setTimeout(() => terminalForm.classList.remove("input-error"), 400);
    manualKey.classList.add("hw-key--alert");
    printToLog(
      command,
      `bash: ${command}: command not found. Press [MAN_HELP] (the blinking LED above) for instructions.`,
      true,
    );
  }

  function updateQuoteCountdown() {
    const now = new Date();
    const target = new Date(Date.UTC(2100, 0, 1));
    if (now.getTime() >= target.getTime()) {
      quoteText.textContent = quotes[1].text;
      quoteAttribution.textContent = quotes[1].attribution;
      quoteCountdown.textContent = "0/00/00 00:00:00";
      window.clearInterval(quoteTimer);
      return;
    }

    let years = target.getUTCFullYear() - now.getUTCFullYear();
    let cursor = addUtcMonths(now, years * 12);
    if (cursor > target) {
      years -= 1;
      cursor = addUtcMonths(now, years * 12);
    }

    let months =
      (target.getUTCFullYear() - cursor.getUTCFullYear()) * 12 +
      target.getUTCMonth() -
      cursor.getUTCMonth();
    let monthCursor = addUtcMonths(cursor, months);
    if (monthCursor > target) {
      months -= 1;
      monthCursor = addUtcMonths(cursor, months);
    }

    const remainingSeconds = Math.floor((target.getTime() - monthCursor.getTime()) / 1000);
    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    quoteCountdown.textContent =
      `${years}y ${String(months).padStart(2, "0")}mo ` +
      `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ` +
      `${String(minutes).padStart(2, "0")}min ${String(seconds).padStart(2, "0")}s`;
  }

  function haltSystem() {
    deck.hidden = true;
    haltScreen.hidden = false;
  }

  function handleCommand(rawCommand) {
    const command = rawCommand.trim();
    if (!command) {
      return;
    }

    const normalized = command.toLowerCase().replace(/\s+/g, " ");
    if (["help", "man"].includes(normalized)) {
      printToLog(command, "Opening manual pages...");
      switchView("manual");
    } else if (["projects", "ls", "github"].includes(normalized)) {
      printToLog(command, "Redirecting to GitHub repositories...");
      window.open(githubUrl, "_blank", "noopener,noreferrer");
    } else if (["clear", "cls"].includes(normalized)) {
      termLog.replaceChildren();
    } else if (["halt", "exit", "shutdown"].includes(normalized)) {
      printToLog(command, "Session terminated.");
      haltSystem();
    } else if (commandResponses.has(normalized)) {
      printToLog(command, commandResponses.get(normalized));
    } else {
      showCommandError(command);
    }
  }

  keypad.addEventListener("click", (event) => {
    const key = event.target.closest(".hw-key[data-target]");
    if (key && keypad.contains(key)) {
      switchView(key.dataset.target);
    }
  });

  terminalView.addEventListener("click", () => terminalInput.focus());
  terminalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const command = terminalInput.value;
    terminalInput.value = "";
    handleCommand(command);
  });

  byId("btn-halt").addEventListener("click", haltSystem);
  byId("btn-boot").addEventListener("click", () => {
    haltScreen.hidden = true;
    deck.hidden = false;
    termLog.replaceChildren();
    printToLog("", "[ SYSTEM REBOOTED ]");
    switchView("terminal");
  });

  updateQuoteCountdown();
  quoteTimer = window.setInterval(updateQuoteCountdown, 1000);
})();
