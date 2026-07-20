function map(value, fromMin, fromMax, toMin, toMax) {
  return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
}

function UUID() {
  if (crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function parseGameTime(baseTime) {
  // convert time from range 0-43200 to 9:00-21:00 and return 24-hour format HH:MM
  time = Math.floor(map(baseTime, 0, 43200, 540, 1260));
  let hours = Math.floor(time / 60);
  let minutes = Math.floor(time % 60);
  let hh = (hours < 10 ? '0' : '') + hours;
  let mm = (minutes < 10 ? '0' : '') + minutes;
  return `${hh}:${mm}`;
} 