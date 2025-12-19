'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { ApiResponse, UserDto } from '@/types/dga'
import {
  FiTool,
  FiActivity,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiUser,
} from 'react-icons/fi'

// ประกาศ type ให้ window.czpSdk
declare global {
  interface Window {
    czpSdk?: {
      getAppId?: () => string
      getToken?: () => string
      setTitle?: (title: string, isShowBackButton: boolean) => void
      setBackButtonVisible?: (visible: boolean) => void
    }
  }
}

interface AppTokenPair {
  appId: string
  mToken: string
}

/**
 * ดึง appId และ mToken จาก SDK ของทางรัฐเท่านั้น (ไม่อ่านจาก URL)
 */
const getAppIdAndMTokenFromSDK = (): AppTokenPair | null => {
  if (typeof window === 'undefined') return null

  const sdk = window.czpSdk
  if (!sdk || typeof sdk.getAppId !== 'function' || typeof sdk.getToken !== 'function') {
    return null
  }

  try {
    const appId = sdk.getAppId()
    const mToken = sdk.getToken()
    if (!appId || !mToken) return null
    return { appId, mToken }
  } catch {
    return null
  }
}

/**
 * อ่าน response แบบปลอดภัย: อ่านเป็น text ก่อน แล้วค่อย parse JSON
 * ป้องกันเคส body ว่าง / ไม่ใช่ JSON / upstream ส่ง HTML กลับมา
 */
async function readApiResponse(resp: Response): Promise<{ json: any; text: string }> {
  const text = await resp.text().catch(() => '')
  const json = (() => {
    if (!text || !text.trim()) return null
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  })()
  return { json, text }
}

function ProductionPageInner() {
  const [result, setResult] = useState<UserDto | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // ดึงค่า ?appId=...&mToken=... จาก URL (fallback)
  const searchParams = useSearchParams()

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      setResult(null)

      try {
        // 1) ลองจาก SDK ก่อน
        const fromSdk = getAppIdAndMTokenFromSDK()

        // 2) ถ้า SDK ไม่มี → fallback จาก URL ?appId=&mToken=
        const appId = fromSdk?.appId ?? searchParams.get('appId')
        const mToken = fromSdk?.mToken ?? searchParams.get('mToken')

        if (!appId || !mToken) {
          setError(
            'ไม่สามารถอ่าน appId/mToken ได้ทั้งจาก SDK และ URL (ตรวจสอบว่าเปิดผ่านแอปทางรัฐ MiniApp หรือแนบ ?appId=...&mToken=... มาหรือไม่)'
          )
          return
        }

        const pair: AppTokenPair = { appId, mToken }

        // (option) ตั้งชื่อ Title + ปุ่ม Back จาก SDK ถ้ามี
        if (typeof window !== 'undefined') {
          const sdk = window.czpSdk
          if (sdk?.setTitle) {
            sdk.setTitle('ตรวจสอบข้อมูลผู้ใช้', true)
          }
        }

        const basePath =
          process.env.NEXT_PUBLIC_BASE_PATH ??
          '' // ถ้าไม่ตั้ง env ก็เป็นค่าว่าง

        const response = await fetch(`${basePath}/api/dga`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pair),
        })

        // ✅ สำคัญ: ห้ามใช้ response.json() ตรงๆ
        const { json, text } = await readApiResponse(response)

        if (!response.ok) {
          setError(`HTTP error: ${response.status}\n${text.slice(0, 800)}`)
          return
        }

        if (!json) {
          setError(`Invalid/empty JSON from /api/dga\n${text.slice(0, 800)}`)
          return
        }

        const data = json as ApiResponse

        if (!data.ok) {
          setError(data.error)
          return
        }

        setResult(data.saved)
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-800">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-800">
                <FiActivity className="h-3 w-3 text-emerald-400" />
              </span>
              <span>Production · SDK Mode</span>
            </div>

            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                DGA Miniapp – ตรวจสอบข้อมูลผู้ใช้
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <FiTool className="h-4 w-4 text-emerald-400" />
                <span>
                  SDK Mode – เรียก{' '}
                  <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-emerald-300">
                    POST /api/dga
                  </code>{' '}
                  โดยใช้{' '}
                  <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-sky-300">
                    appId
                  </code>{' '}
                  และ{' '}
                  <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-sky-300">
                    mToken
                  </code>{' '}
                  จาก{' '}
                  <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-violet-300">
                    window.czpSdk
                  </code>
                </span>
              </p>
            </div>
          </div>

          {/* (optional) ใส่ปุ่มกลับ/ลิงก์อื่นได้ */}
          {/* <Link ...>...</Link> */}
        </header>

        {/* Main content */}
        <main className="grid flex-1 gap-6 md:grid-cols-[1.3fr,1fr]">
          {/* Status & messages */}
          <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <FiActivity className="h-4 w-4 text-emerald-400" />
                  <span>สถานะการประมวลผล</span>
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  validate → deproc → บันทึกลงฐานข้อมูล
                </p>
              </div>

              {/* Badge ตามสถานะ */}
              <div>
                {loading && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
                    <FiLoader className="h-3 w-3 animate-spin text-emerald-400" />
                    <span>กำลังประมวลผล</span>
                  </span>
                )}
                {!loading && error && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 ring-1 ring-red-500/40">
                    <FiAlertCircle className="h-3 w-3" />
                    <span>เกิดข้อผิดพลาด</span>
                  </span>
                )}
                {!loading && !error && result && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/40">
                    <FiCheckCircle className="h-3 w-3" />
                    <span>สำเร็จแล้ว</span>
                  </span>
                )}
                {!loading && !error && !result && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                    <FiActivity className="h-3 w-3 text-slate-400" />
                    <span>รอข้อมูลจาก SDK</span>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-950/60 p-3 text-xs text-slate-200 ring-1 ring-slate-800/70">
              {loading && (
                <p>
                  ส่งคำขอไปยังระบบกลางแล้ว…{' '}
                  <span className="text-slate-400">
                    (กำลังตรวจสอบ token และดึงข้อมูลผู้ใช้)
                  </span>
                </p>
              )}

              {error && <p className="whitespace-pre-wrap text-red-300">{error}</p>}

              {!loading && !error && !result && (
                <p className="text-slate-300">
                  ยังไม่ได้รับข้อมูลจาก SDK ของทางรัฐ หรือกำลังรอการประมวลผลแรกเริ่ม…
                </p>
              )}

              {!loading && !error && result && (
                <p className="text-emerald-300">ดึงข้อมูลผู้ใช้สำเร็จ และบันทึกลงฐานข้อมูลแล้ว</p>
              )}
            </div>
          </section>

          {/* Quick user summary */}
          <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <FiUser className="h-4 w-4 text-sky-300" />
              <span>สรุปข้อมูลผู้ใช้ล่าสุด</span>
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              ข้อมูลจากฐานข้อมูล Postgres (หลังผ่าน deproc แล้ว)
            </p>

            {result ? (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">ชื่อ - นามสกุล</p>
                  <p className="font-medium text-slate-50">
                    {result.firstName ?? '-'} {result.lastName ?? ''}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Citizen ID</p>
                    <p className="font-medium text-slate-100">{result.citizenId ?? '-'}</p>
                  </div>

                  <div>
                    <p className="text-slate-400">Mobile</p>
                    <p className="font-medium text-slate-100">{result.mobile ?? '-'}</p>
                  </div>

                  <div>
                    <p className="text-slate-400">Email</p>
                    <p className="font-medium text-slate-100">{result.email ?? '-'}</p>
                  </div>

                  <div>
                    <p className="text-slate-400">Notification</p>
                    <p className="font-medium">
                      {result.notification ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300 ring-1 ring-emerald-500/40">
                          เปิดอยู่
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] text-slate-200">
                          ปิดอยู่
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-400">
                ยังไม่มีข้อมูลผู้ใช้ที่บันทึกในรอบล่าสุด
              </div>
            )}
          </section>
        </main>

        {/* ✅ ลบ Raw JSON ออกแล้ว ตามที่ขอ */}
      </div>
    </div>
  )
}

/**
 * default export – ครอบด้วย Suspense ตามที่ Next.js ต้องการ
 */
export default function ProductionPage() {
  return (
    <Suspense fallback={<div className="p-4 text-slate-200">Loading...</div>}>
      <ProductionPageInner />
    </Suspense>
  )
}
