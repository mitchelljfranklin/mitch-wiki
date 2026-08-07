import { Injectable } from '@nestjs/common';

@Injectable()
export class LicenseCheckService {
  constructor() {}

  isValidEELicense(licenseKey: string): boolean {
    return false;
  }

  hasFeature(licenseKey: string, feature: string, plan?: string): boolean {
    return false;
  }

  getFeatures(licenseKey: string): string[] {
    return [];
  }

  resolveFeatures(licenseKey: string, plan: string): string[] {
    return [];
  }

  resolveTier(licenseKey: string, plan: string): string {
    return 'free';
  }

  private getLicenseType(licenseKey: string): string | null {
    return null;
  }
}
