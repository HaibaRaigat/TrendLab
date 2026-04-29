'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // محاكاة توقيت التحميل للشريط (مثلاً 2.5 ثانية)
    const duration = 2500
    const intervalTime = 30
    const steps = duration / intervalTime

    // تحريك الشريط تدريجياً
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) return 100
        return p + (100 / steps)
      })
    }, intervalTime)

    // إخفاء شاشة التحميل بعد الانتهاء بوقت قصير
    const timeout = setTimeout(() => {
      setIsVisible(false)
    }, duration + 300)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden"
        >
          {/* خلفية الشاشة */}
          <div className="absolute inset-0 z-0">
            {/* يمكنك تغيير مسار الصورة الخلفية بإضافة bg.jpg في مجلد public */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/bg.jpg')" }}
            />
            {/* طبقة سوداء شفافة (Transparence أسود) حتى يظهر اللوجو بوضوح */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          </div>

          {/* محتوى الشاشة (اللوجو وشريط التحميل) */}
          <div className="relative z-10 flex flex-col items-center gap-12">

            {/* اللوجو مع أنيميشن جميل */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                ease: "easeOut",
                type: "spring",
                bounce: 0.5
              }}
              className="relative flex items-center justify-center"
            >
              {/* مسار اللوجو - أضف logo.png إلى مجلد public */}
              <img
                src="/logo.png"
                alt="TrendLab Logo"
                className="w-40 h-40 object-contain drop-shadow-2xl"
                onError={(e) => {
                  // في حال لم تضع الصورة بعد، سيظهر هذا البديل المؤقت
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<div class="w-32 h-32 flex flex-col items-center justify-center rounded-2xl bg-primary/20 border border-primary/40"><span class="text-primary font-bold text-5xl">T</span><span class="text-white/60 text-xs mt-2">Add logo.png</span></div>')
                }}
              />
            </motion.div>

            {/* شريط التحميل */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-56 flex flex-col items-center gap-4"
            >
              {/* الحاوية الخارجية للشريط */}
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
                {/* الشريط الداخلي الملون */}
                <motion.div
                  className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_8px_theme(colors.primary)] rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <span className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.25em] animate-pulse">
                Loading ...
              </span>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
