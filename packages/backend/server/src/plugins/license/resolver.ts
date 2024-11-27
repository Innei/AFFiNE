import {
  Args,
  Field,
  Mutation,
  ObjectType,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';

import { ActionForbidden, Config } from '../../base';
import { CurrentUser } from '../../core/auth';
import { Permission, PermissionService } from '../../core/permission';
import { WorkspaceType } from '../../core/workspaces';
import { LicenseService } from './service';

@ObjectType()
export class License {
  @Field(() => Date)
  installedAt!: Date;

  @Field(() => Date)
  validatedAt!: Date;
}

@Resolver(() => WorkspaceType)
export class LicenseResolver {
  constructor(
    private readonly config: Config,
    private readonly service: LicenseService,
    private readonly permission: PermissionService
  ) {}

  @ResolveField(() => License, {
    complexity: 2,
    description: 'The selfhost license of the workspace',
    nullable: true,
  })
  async license(
    @CurrentUser() user: CurrentUser,
    @Parent() workspace: WorkspaceType
  ) {
    // NOTE(@forehalo):
    //   we can't simply disable license resolver for non-selfhosted server
    //   it will make the gql codegen messed up.
    if (!this.config.isSelfhosted) {
      return null;
    }

    await this.permission.checkWorkspaceIs(
      workspace.id,
      user.id,
      Permission.Owner
    );

    return this.service.getLicense(workspace.id);
  }

  @Mutation(() => License)
  async activateLicense(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string,
    @Args('license') license: string
  ) {
    if (!this.config.isSelfhosted) {
      throw new ActionForbidden();
    }

    await this.permission.checkWorkspaceIs(
      workspaceId,
      user.id,
      Permission.Owner
    );

    return this.service.activateTeamLicense(workspaceId, license);
  }

  @Mutation(() => Boolean)
  async deactivateLicense(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string
  ) {
    if (!this.config.isSelfhosted) {
      throw new ActionForbidden();
    }

    await this.permission.checkWorkspaceIs(
      workspaceId,
      user.id,
      Permission.Owner
    );

    return this.service.deactivateTeamLicense(workspaceId);
  }
}
