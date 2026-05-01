export interface Video {
  id: string
  videoURL: string
  thumbnailURL?: string
  likes: number
  channelId: string
  trendId: string
  trendTag: string
  timestamp: Date | { seconds: number; nanoseconds: number }
  description?: string
  duration?: number
  archived?: boolean
  archiveId?: string
}

export interface Channel {
  id: string
  name: string
  profileImageURL: string
  members: string[]
  type: 'individual' | 'group'
  createdAt: Date | { seconds: number; nanoseconds: number }
}

export interface Trend {
  id: string
  tag: string
  weekLabel: string
  startDate: Date | { seconds: number; nanoseconds: number }
  endDate?: Date | { seconds: number; nanoseconds: number }
  active: boolean
  createdAt: Date | { seconds: number; nanoseconds: number }
}

export interface Archive {
  id: string
  trendId: string
  trendTag: string
  weekLabel: string
  videos: string[]
  createdAt: Date | { seconds: number; nanoseconds: number }
}

export interface VideoWithChannel extends Video {
  channel?: Channel
}

export interface User {
  id: string
  identifier: string
  type: 'individual' | 'group'
  channelId: string
  createdAt: Date | { seconds: number; nanoseconds: number }
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date | { seconds: number; nanoseconds: number }
}

export interface AuthUser {
  id: string
  identifier: string
  type: 'individual' | 'group'
  channelId: string
  channel?: Channel
}

export const STUDENTS_LIST = [
  "AIT ALI OUBARI OUSSAMA", "ARBAA HANANE", "BERHIL IBTISSAM", "BOUGLIME KAWTHAR", 
        "BOUHDOUD FADWA", "BOULHILAT FATIMA ZAHRA", "BOUROUAIS NAJAT", "DLIMI HASNA", 
        "EL BAZ BASMA", "EL GHOUAT IKRAM", "EL HAYMAR EL HOUCINE", "ELAAYBEL SIHAM", 
        "ELAZZOUZI YASSER", "ELOITAAI LAILA", "ENILY WISSAL", "ER-REMYTY FATIHA", 
        "ESSAHOUQUI DOHA", "GHOURABI YASSMINE", "HAJIB CHAYMAE", "HILAL NORA", 
        "ID-HAMOU ABDELILAH", "JABBA MARIEM", "LAHMAID IMANE", "MADAD IKRAM", 
        "MAISSINE WAFAE", "MAKHOU LINA", "R'BIB NOUHAILA", "SANNAD NOUHAILA", 
        "SMAAINE MARIAM", "ZORO FATIHA"
]
