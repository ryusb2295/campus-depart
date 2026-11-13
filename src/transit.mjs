export function scheduleType(date) {
 const day = new Date(`${date}T12:00:00+09:00`).getUTCDay();
 return day === 0 ? 'HOLIDAY' : day === 6 ? 'SAT' : 'WEEKDAY';
}
export function parseSchedule(xml) {
 if (/<(?:parsererror|html)\b/i.test(xml)) throw new Error('시간표 대신 오류 페이지가 반환됐어요.');
 const blocks = [...xml.matchAll(/<SCHEDULE(?:\s[^>]*)?>([\s\S]*?)<\/SCHEDULE>/gi)];
 const times = blocks.flatMap(m => [...m[1].matchAll(/\b(\d{1,2}):([0-5]\d)\b/g)].map(t => Number(t[1])*60+Number(t[2])));
 const result = [...new Set(times)].filter(t => t < 1440).sort((a,b)=>a-b);
 if (!result.length) throw new Error('조회된 열차시각이 없어요. 역 이름과 방향을 확인해 주세요.');
 return result;
}
