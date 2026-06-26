import { BleManager, Device } from 'react-native-ble-plx';

export type HudPriority = 'low' | 'normal' | 'urgent';

export type HudCard = {
  title: string;
  body: string;
  priority: HudPriority;
  ttlSeconds: number;
};

const ALLERION_HUD_SERVICE_UUID = '7f4b0001-8e7c-4f7a-91a7-allerionhud1'.replace('allerionhud1', 'a11e71000001');
const HUD_CARD_CHARACTERISTIC_UUID = '7f4b0002-8e7c-4f7a-91a7-a11e71000002';

function toBase64(input: string): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(input, 'utf8').toString('base64');
  // Expo runtime fallback
  return globalThis.btoa(unescape(encodeURIComponent(input)));
}

export class GlassesBleClient {
  private manager = new BleManager();
  private device?: Device;

  async connect(): Promise<Device> {
    const devices = await this.manager.devices([]);
    const known = devices.find((device) => device.name?.toLowerCase().includes('allerion'));

    if (known) {
      this.device = await known.connect();
      await this.device.discoverAllServicesAndCharacteristics();
      return this.device;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.manager.stopDeviceScan();
        reject(new Error('No ALLERION HUD glasses found. Power on the prototype and retry.'));
      }, 12000);

      this.manager.startDeviceScan([ALLERION_HUD_SERVICE_UUID], null, async (error, scannedDevice) => {
        if (error) {
          clearTimeout(timeout);
          this.manager.stopDeviceScan();
          reject(error);
          return;
        }

        if (!scannedDevice) return;

        clearTimeout(timeout);
        this.manager.stopDeviceScan();
        this.device = await scannedDevice.connect();
        await this.device.discoverAllServicesAndCharacteristics();
        resolve(this.device);
      });
    });
  }

  async sendHudCard(card: HudCard): Promise<void> {
    if (!this.device) throw new Error('Glasses are not connected.');

    const payload = JSON.stringify({
      type: 'hud.card',
      issuedAt: new Date().toISOString(),
      card,
    });

    await this.device.writeCharacteristicWithResponseForService(
      ALLERION_HUD_SERVICE_UUID,
      HUD_CARD_CHARACTERISTIC_UUID,
      toBase64(payload),
    );
  }
}
