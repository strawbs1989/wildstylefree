function NowON() {
  const now = new Date()
  const ukTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))
  const localHour = ukTime.getHours()
  const day = ukTime.getDay()
  const prevDay = (day - 1 + 7) % 7

  const isInShow = (startHour, slot, hour) => {
    const start = parseInt(startHour)
    const end = (start + slot.duration) % 24
    return start <= hour && hour < end || (end < start && (hour >= start || hour < end))
  }

  const currentShow = Object.entries(DH[day])
    .filter(([, slot]) => slot !== null)
    .find(([startHour, slot]) => isInShow(startHour, slot, localHour))

  const prevDayShow = !currentShow ? Object.entries(DH[prevDay])
    .filter(([, slot]) => slot !== null)
    .find(([startHour, slot]) => {
      const start = parseInt(startHour)
      const end = start + slot.duration
      return end >= 24 && localHour < end - 24
    }) : null

  const show = (currentShow?.[1] || prevDayShow?.[1])?.show || "🕓 Off Air<br>No current broadcast."
  document.getElementById("NowOn").innerHTML = show
}

setInterval(NowON, 60000)
