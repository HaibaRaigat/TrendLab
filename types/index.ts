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

export const STUDENTS_LIST = [
  "Ait Ouali Ahmed",
  "Amzil Fatima",
  "Aouad Youssef",
  "Azoulay Sara",
  "Bakrim Mohamed",
  "Barakat Hind",
  "Belhaj Karim",
  "Benali Nora",
  "Benchekroun Imane",
  "Benjelloun Omar",
  "Bensalem Aya",
  "Bensalah Khalid",
  "Benyahia Laila",
  "Bouhaddou Zineb",
  "Boukhris Rachid",
  "Boutaleb Meryem",
  "Chaoui Hamza",
  "Dahbi Salma",
  "Eddahbi Ilham",
  "El Amine Saad",
  "El Ayoubi Hajar",
  "El Ghazi Soufiane",
  "El Idrissi Amina",
  "El Khatib Nassim",
  "El Malki Widad",
  "El Mokhtar Asmae",
  "El Ouafi Tariq",
  "Ennaji Rida",
  "Errachidi Khadija",
  "Essabiry Mehdi",
  "Essaidi Oumaima",
  "Fadili Brahim",
  "Faqir Houda",
  "Ghailani Anas",
  "Hachim Siham",
  "Hamdaoui Loubna",
  "Hamidi Yasmina",
  "Hassani Mustapha",
  "Hilali Nadia",
  "Idrissi Mounia",
  "Jadid Younes",
  "Jamal Ghizlane",
  "Jouahri Othmane",
  "Kabbaj Samira",
  "Kadiri Amine",
  "Khalili Wafaa",
  "Khattabi Iliass",
  "Laabidi Nisrine",
  "Lahlou Abdelilah",
  "Lakhdar Rim",
  "Lamrani Badr",
  "Laouina Soukaina",
  "Lazaar Moad",
  "Lekhal Sanae",
  "Lhaloui Kawtar",
  "Maataoui Taha",
  "Maatouf Jamila",
  "Mahboub Yassir",
  "Makhtari Chaimae",
  "Mansouri Abdelaziz",
  "Mernissi Leila",
  "Mouhsine Rkia",
  "Mouline Ayoub",
  "Mounia Sabrina",
  "Mouttaki Nabil",
  "Naciri Faouzia",
  "Nafii Bouchra",
  "Naili Mostafa",
  "Ouali Hasnaa",
  "Ouazzani Aziz",
  "Ouhaddou Ibtissam",
  "Qaissi Hamid",
  "Rafii Dounia",
  "Rami Anass",
  "Rhabi Ilyas",
  "Rouane Fadwa",
  "Saadani Jawad",
  "Saber Fatna",
  "Sabiri Hakim",
  "Saddik Dalal",
  "Safi Oussama",
  "Sahbi Mounir",
  "Salam Fatiha",
  "Salmi Amal",
  "Sefiani Yousra",
  "Sekkat Karima",
  "Senhaji Abdou",
  "Serghini Meriem",
  "Slimani Hassan",
  "Talbi Naoual",
  "Tazi Anouar",
  "Tlemcani Rachida",
  "Wahbi Mourad",
  "Yaacoubi Naima",
  "Zeghari Adil",
  "Zeroual Souad",
  "Zidane Fathia",
  "Zriouil Youssra"
]
