import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Wrapper สำหรับการเรียกใช้ Firebase Cloud Functions (Callable)
 * จัดการ Error ให้อยู่ในรูปแบบ Object ตามที่กำหนด
 */
export async function callCloudFunction<TReq = any, TRes = any>(
  name: string,
  data?: TReq
): Promise<TRes> {
  const callable = httpsCallable<TReq, TRes>(functions, name);
  try {
    const result = await callable(data);
    return result.data;
  } catch (error: any) {
    throw {
      code: error.code || 'unknown',
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
      details: error.details,
    };
  }
}