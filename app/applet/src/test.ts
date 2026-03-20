import { parseDate, calculateAge } from './utils/dateUtils.js';

console.log(parseDate("15/08/1990"));
console.log(parseDate("1990-01-01"));
console.log(parseDate(new Date()));
console.log(calculateAge("15/08/1990"));
