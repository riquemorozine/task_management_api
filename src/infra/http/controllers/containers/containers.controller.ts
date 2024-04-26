import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
  Put,
  Res,
  Delete,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ValidatorPipe } from '@app/utils/validators/pipes/validatorPipes';
import { PrismaService } from '@infra/database/prisma.service';
import { AuthGuard } from '@app/guards/auth.guard';

import {
  AddUserContainerSchema,
  CreateContainerSchema,
  UpdateUserRoleSchema,
} from '@app/utils/validators/schemas/Container/container';

import {
  IAddUserToContainer,
  IContainerCreate,
} from '@domains/requests/container/container';

import { AddUserToContainerService } from '@app/useCases/container/addUserToContainer.service';
import { CreateContainerService } from '@app/useCases/container/createContainer.service';
import { DeleteContainerService } from '@app/useCases/container/deleteContainer.service';
import { FindManyContainersService } from '@app/useCases/container/findManyContainers.service';
import { GetContainerByIdService } from '@app/useCases/container/getContainerById.service';
import { UpdateUserRolesService } from '@app/useCases/container/updateUserRole.service';
import { DeleteContainerSchema } from '@app/utils/validators/schemas/Container/deleteContainer';
import { RolesGuard } from '@app/guards/roles.guard';
import { Roles } from '@app/decorators/roles.decorator';
import { Roles as roles } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { IDeleteContainer } from '@domains/requests/container/deleteContainer';

@ApiTags('Containers')
@Controller('containers')
export class ContainerController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly addUserToContainerService: AddUserToContainerService,
    private readonly createContainerService: CreateContainerService,
    private readonly deleteContainerService: DeleteContainerService,
    private readonly findManyContainersService: FindManyContainersService,
    private readonly getContainerByIdService: GetContainerByIdService,
    private readonly updateUserRolesService: UpdateUserRolesService,
  ) {}

  @Get('find/:containerId')
  @UseGuards(AuthGuard)
  async getContainerById(@Req() req: Request, @Res() res: Response) {
    await this.prismaService.$transaction(async (transaction) => {
      const container = await this.getContainerByIdService.execute(
        req.params.containerId,
        req.user.id,
        transaction,
      );

      res.json(container).status(200);
    });
  }

  @Delete('delete')
  @UseGuards(AuthGuard)
  async deleteContainer(
    @Body(new ValidatorPipe(DeleteContainerSchema)) body: IDeleteContainer,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.prismaService.$transaction(async (transaction) => {
      await this.deleteContainerService.execute(
        body.containerId,
        req.user.id,
        transaction,
      );

      res.status(200).send();
    });
  }

  @Post('create')
  @UseGuards(AuthGuard)
  async createContainer(
    @Body(new ValidatorPipe(CreateContainerSchema)) body: IContainerCreate,
    @Req() Req: Request,
  ) {
    await this.prismaService.$transaction(async (transaction) => {
      await this.createContainerService.execute(body, Req.user.id, transaction);
    });
  }

  @Get('all')
  @UseGuards(AuthGuard)
  async getAllUserContainers(@Req() req: Request, @Res() res: Response) {
    await this.prismaService.$transaction(async (transaction) => {
      const containers = await this.findManyContainersService.execute(
        req.user.id,
        transaction,
      );

      res.json(containers).status(200);
    });
  }

  @Put('add/user')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(roles.Admin)
  async addUserToContainer(
    @Body(new ValidatorPipe(AddUserContainerSchema)) body: IAddUserToContainer,
    @Req() req: Request,
  ) {
    await this.prismaService.$transaction(async (transaction) => {
      const { containerId, userId, userRole } = body;

      await this.addUserToContainerService.execute(
        userId,
        containerId,
        transaction,
        userRole,
      );
    });
  }

  @Put('update/user/role')
  @UseGuards(AuthGuard)
  @Roles(roles.Admin, roles.Moderator)
  async updateUserRole(
    @Body(new ValidatorPipe(UpdateUserRoleSchema)) body: IAddUserToContainer,
  ) {
    await this.prismaService.$transaction(async (transaction) => {
      const { containerId, userId, userRole } = body;

      await this.updateUserRolesService.execute(
        containerId,
        userId,
        userRole,
        transaction,
      );
    });
  }
}
