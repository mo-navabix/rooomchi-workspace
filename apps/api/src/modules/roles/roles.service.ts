import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RoleEnum } from '../../common/enums/role.enum';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultRoles();
  }

  async seedDefaultRoles(): Promise<void> {
    const rolesToSeed = [
      {
        name: RoleEnum.SUPER_ADMIN,
        description: 'Super Administrator with platform-wide oversight and organization provisioning',
      },
      {
        name: RoleEnum.ORGANIZATION_ADMIN,
        description: 'Organization Administrator with full rights over company employees, rooms, and policies',
      },
      {
        name: RoleEnum.MANAGER,
        description: 'Department Manager with meeting room management and reservation approval permissions',
      },
      {
        name: RoleEnum.EMPLOYEE,
        description: 'Company Employee with room discovery, booking, and personal calendar access',
      },
    ];

    for (const item of rolesToSeed) {
      const existing = await this.roleRepository.findOne({ where: { name: item.name } });
      if (!existing) {
        await this.roleRepository.save(
          this.roleRepository.create({
            name: item.name,
            description: item.description,
          }),
        );
      }
    }
  }

  async findByName(name: RoleEnum): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async findById(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }
}
