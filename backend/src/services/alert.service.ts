import { prisma } from '../index';
import { logger } from '../utils/logger';
import { AlertType, AlertStatus } from '@prisma/client';
import nodemailer from 'nodemailer';

export class AlertService {
  private transporter: nodemailer.Transporter | null = null;
  private emailEnabled: boolean;

  constructor() {
    this.emailEnabled = process.env.EMAIL_ENABLED === 'true';

    if (this.emailEnabled) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  /**
   * Check for expiring contracts and create alerts
   */
  async checkExpiringContracts(): Promise<void> {
    const alertDays = [90, 60, 30]; // Days before expiry to send alerts
    const today = new Date();

    for (const days of alertDays) {
      const alertDate = new Date();
      alertDate.setDate(today.getDate() + days);

      // Find contracts expiring on this date
      const expiringContracts = await prisma.maintenanceContract.findMany({
        where: {
          isActive: true,
          endDate: {
            gte: new Date(alertDate.toDateString()),
            lt: new Date(new Date(alertDate).setDate(alertDate.getDate() + 1)),
          },
        },
      });

      for (const contract of expiringContracts) {
        // Check if alert already exists
        const existingAlert = await prisma.contractAlert.findFirst({
          where: {
            contractId: contract.id,
            alertType: this.getAlertType(days),
          },
        });

        if (!existingAlert) {
          await prisma.contractAlert.create({
            data: {
              contractId: contract.id,
              alertType: this.getAlertType(days),
              alertDate: today,
            },
          });

          logger.info(`Created alert for contract ${contract.contractNumber} expiring in ${days} days`);
        }
      }
    }
  }

  /**
   * Send pending alerts
   */
  async sendPendingAlerts(): Promise<void> {
    const pendingAlerts = await prisma.contractAlert.findMany({
      where: {
        status: AlertStatus.PENDING,
        alertDate: {
          lte: new Date(),
        },
      },
      include: {
        contract: {
          include: {
            assets: {
              include: {
                asset: {
                  include: {
                    model: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const alert of pendingAlerts) {
      try {
        await this.sendAlert(alert);

        await prisma.contractAlert.update({
          where: { id: alert.id },
          data: {
            status: AlertStatus.SENT,
            sentAt: new Date(),
          },
        });

        logger.info(`Sent alert for contract ${alert.contract.contractNumber}`);
      } catch (error) {
        logger.error(`Failed to send alert for contract ${alert.contract.contractNumber}:`, error);

        await prisma.contractAlert.update({
          where: { id: alert.id },
          data: {
            status: AlertStatus.FAILED,
          },
        });
      }
    }
  }

  /**
   * Send a single alert
   */
  private async sendAlert(alert: any): Promise<void> {
    if (!this.emailEnabled || !this.transporter) {
      logger.warn('Email is disabled, skipping alert send');
      return;
    }

    const contract = alert.contract;
    const daysUntilExpiry = Math.ceil(
      (new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const assetCount = contract.assets.length;
    const assetList = contract.assets
      .slice(0, 10)
      .map((a: any) => `- ${a.asset.hostname || a.asset.serialNumber} (${a.asset.model.modelName})`)
      .join('\n');

    const subject = `Contract Expiring Soon: ${contract.contractNumber}`;
    const body = `
Contract Alert

Contract Number: ${contract.contractNumber}
Contract Type: ${contract.contractType}
Vendor: ${contract.vendor}
End Date: ${contract.endDate.toISOString().split('T')[0]}
Days Until Expiry: ${daysUntilExpiry}

Covered Assets: ${assetCount}
${assetList}
${assetCount > 10 ? `\n... and ${assetCount - 10} more` : ''}

Annual Cost: ${contract.annualCost ? `$${contract.annualCost}` : 'N/A'}
Auto Renewal: ${contract.autoRenewal ? 'Yes' : 'No'}

Please review and renew this contract before it expires.
    `.trim();

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // TODO: Add recipients management
      subject,
      text: body,
    });
  }

  private getAlertType(days: number): AlertType {
    switch (days) {
      case 90: return AlertType.CONTRACT_EXPIRY_90;
      case 60: return AlertType.CONTRACT_EXPIRY_60;
      case 30: return AlertType.CONTRACT_EXPIRY_30;
      default: return AlertType.CONTRACT_EXPIRY_30;
    }
  }
}

const alertService = new AlertService();

export const checkAndSendAlerts = async () => {
  await alertService.checkExpiringContracts();
  await alertService.sendPendingAlerts();
};
