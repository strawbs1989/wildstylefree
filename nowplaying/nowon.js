const DH = Array.from({ length: 7 }, () => Array(24).fill(null))

// MONDAY
DH[1][10] = { show: "1am – 3am<br>DJ Carrillo", duration: 3 }
DH[1][10] = { show: "10am – 12pm<br>", duration: 2 }
DH[1][12] = { show: "7am – 8am<br>DJ Keeks", duration: 2 }
DH[1][10] = { show: "8am – 10am<br>Coll", duration: 2 }
DH[1][12] = { show: "12pm – 2pm<br>James-Wizard Of Rock", duration: 2 }
DH[1][14] = { show: "2pm – 4pm<br>Auto", duration: 2 }
DH[1][15] = { show: "3pm – 5pm<br>James Stephen", duration: 2 }
DH[1][17] = { show: "5pm – 7pm<br>Lewis", duration: 2 }
DH[1][19] = { show: "7pm – 10pm<br>Auto", duration: 3 }
DH[1][22] = { show: "10pm – 12am<br>Auto", duration: 2 }

// TUESDAY
DH[2][1] = { show: "1am – 2am<br>James - Wizard Of Rock", duration: 1 }
DH[2][3] = { show: "3am – 6am<br>Dani - DJ Queen Dani", duration: 3 }
DH[2][6] = { show: "6am – 8am<br>Auto", duration: 2 }
DH[2][15] = { show: "3pm – 5pm<br>James Stephen", duration: 2 }
DH[2][15] = { show: "6pm – 8pm<br>DJ Squeek", duration: 2 }
DH[2][20] = { show: "8pm – 10pm<br>Dj Lewis", duration: 2 }
DH[2][10] = { show: "10am – 12pm<br>HothotDJ", duration: 2 }

// WEDNESDAY
DH[3][10] = { show: "8am – 10am<br>Coll", duration: 2 }
DH[3][10] = { show: "10am – 12pm<br>", duration: 2 }
DH[3][15] = { show: "3pm – 5pm<br>", duration: 2 }
DH[3][18] = { show: "6pm – 7pm<br>Auto", duration: 1 }
DH[3][20] = { show: "8pm – 10pm<br>", duration: 2 }
DH[3][22] = { show: "10pm – 12am<br>Auto", duration: 2 }

// THURSDAY
DH[4][8] = { show: "8am – 10am<br>Coll", duration: 2 }
DH[4][0] = { show: "12am – 4am<br>Auto", duration: 4 }
DH[4][10] = { show: "10am – 12pm<br>DJ Barred", duration: 2 }
DH[4][03] = { show: "1pm – 3pm<br>Christina", duration: 2 }
DH[4][15] = { show: "3pm – 4pm<br>Auto", duration: 1 }
DH[4][19] = { show: "7pm – 8pm<br>Echofalls(DJ Strawbs)", duration: 1 }
DH[4][20] = { show: "8pm – 10pm<br>Russ", duration: 2 }
DH[4][22] = { show: "10pm – 11pm<br>MottMuzik", duration: 1 }

// FRIDAY
DH[5][0] = { show: "12am – 4am<br>SteveG", duration: 4 }
DH[5][10] = { show: "10am – 12pm<br>Dani - DJ Queen Dani", duration: 2 }
DH[5][15] = { show: "3pm – 5pm<br>James Stephen", duration: 2 }
DH[5][16] = { show: "4pm – 8pm<br>StevenD", duration: 4 }
DH[5][20] = { show: "8pm – 10pm<br>DJ indigo Riz", duration: 2 }
DH[5][22] = { show: "10pm – 11pm<br>Rebecca - DJ Mix&Match", duration: 1 }
DH[5][00] = { show: "12pm – 3pm<br>DJ Nala", duration: 3 }
// SATURDAY
DH[6][0] = { show: "12am – 2am<br>Auto", duration: 2 }
DH[6][2] = { show: "2am – 4am<br>DJ AJ", duration: 2 }
DH[6][2] = { show: "4am – 6am<br>Wendell", duration: 2 }
DH[6][16] = { show: "4pm – 6pm<br>The Byrdman", duration: 2 }
DH[6][18] = { show: "6pm –8pm<br>DJ LiL Devil", duration: 2 }
DH[6][19] = { show: "7pm – 8pm<br>Sonic-Recorded", duration: 1 }
DH[6][19] = { show: "8pm – 10pm<br>DJ indigo Riz", duration: 2 }
DH[6][6] = { show: "6am – 10am<br>Cam", duration: 4 }
DH[6][10] = { show: "10am – 12pm<br>DJ Nitro", duration: 2 }
DH[6][20] = { show: "8pm – 9pm<br>Daniel", duration: 1 }


// SUNDAY
DH[0][8] = { show: "8am – 10am<br>Dani - DJ Queen Dani", duration: 2 }
DH[0][11] = { show: "11am – 12pm<br>HotShot - 80's 90's", duration: 1 }
DH[0][12] = { show: "12pm – 1pm<br>Dutch", duration: 1 }
DH[0][13] = { show: "1pm – 3pm<br>Christina", duration: 2 }
DH[0][15] = { show: "3pm – 5pm<br>DJ Fraser", duration: 2 }
DH[0][17] = { show: "5pm – 7pm<br>DJ Lewis", duration: 2 }
DH[0][19] = { show: "7pm - 8pm<br>Auto", duration: 1 }
DH[0][20] = { show: "8pm - 9pm<br>BIG BOSS Dj Echofalls", duration: 1 }
DH[0][21] = { show: "9pm - 12am<br>Popped Radio", duration: 3 }

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
 
  // Check current day's shows
  const currentShow = Object.entries(DH[day])
    .filter(([, slot]) => slot !== null)
    .find(([startHour, slot]) => isInShow(startHour, slot, localHour))
 
  // If no show found, check if a show from previous day is still running
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
