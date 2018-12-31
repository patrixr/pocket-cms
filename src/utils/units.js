

function milliseconds(n = 1) {
    return n;
}

function millisecond() {
  return milliseconds(1);
}

function seconds(n = 1) {
  return n * milliseconds(1000);
}

function second() {
  return seconds(1);
}

function minutes(n = 1) {
  return n * seconds(60);
}

function minute() {
  return minutes(1);
}

function hours(n = 1) {
  return n * minutes(60);
}

function hour() {
  return hours(1);
}

function days(n = 1) {
  return n * hours(24);
}

function  day() {
  return days(1);
}

function  weeks(n = 1) {
  return n * days(7);
}

function week() {
  return weeks(1);
}

function toKilobytes(bytes) {
  return bytes / 1024;
}

function toMegabytes(bytes) {
  return toKilobytes(bytes) / 1024;
}

function toGigabytes(bytes) {
  return toMegabytes(bytes) / 1024;
}

module.exports = {
  millisecond,
  milliseconds,
  second,
  seconds,
  minute,
  minutes,
  hour,
  hours,
  day,
  days,
  week,
  weeks,
  convert: {
    to: {
      kilobytes: toKilobytes,
      megabytes: toMegabytes,
      gigabytes: toGigabytes,
    }
  }
};
