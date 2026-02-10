import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSettingDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(category?: string) {
    const where: any = {};
    if (category) {
      where.category = category;
    }

    return this.prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async findByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  /**
   * Retrieve a setting's value by key. Intended for use by other modules.
   * Returns the default value when the key does not exist.
   */
  async getValue(key: string, defaultValue?: string): Promise<string | undefined> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    return setting ? setting.value : defaultValue;
  }

  async update(
    key: string,
    value: string,
    description: string | undefined,
    adminId: number,
    ip?: string,
  ) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    const previousValue = existing.value;

    const updated = await this.prisma.systemSetting.update({
      where: { key },
      data: {
        value,
        ...(description !== undefined && { description }),
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'update_setting',
      entityType: 'system_setting',
      entityId: updated.id,
      details: { key, previousValue, newValue: value },
      ipAddress: ip,
    });

    this.logger.log(`Setting "${key}" updated by admin ${adminId}`);

    return updated;
  }

  async create(dto: CreateSettingDto, adminId: number, ip?: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(`Setting with key "${dto.key}" already exists`);
    }

    const setting = await this.prisma.systemSetting.create({
      data: {
        key: dto.key,
        value: dto.value,
        description: dto.description || null,
        category: dto.category || null,
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'create_setting',
      entityType: 'system_setting',
      entityId: setting.id,
      details: { key: dto.key, value: dto.value, category: dto.category },
      ipAddress: ip,
    });

    this.logger.log(`Setting "${dto.key}" created by admin ${adminId}`);

    return setting;
  }

  async remove(key: string, adminId: number, ip?: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    await this.prisma.systemSetting.delete({
      where: { key },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'delete_setting',
      entityType: 'system_setting',
      entityId: existing.id,
      details: { key, value: existing.value, category: existing.category },
      ipAddress: ip,
    });

    this.logger.log(`Setting "${key}" deleted by admin ${adminId}`);

    return { deleted: true, key };
  }
}
