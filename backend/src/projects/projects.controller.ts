import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

interface AuthenticatedRequest {
  user: {
    id: number;
    email: string;
  };
}

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.projectsService.create(
      createProjectDto,
      request.user.id,
    );
  }

  @Get()
  findAll(@Request() request: AuthenticatedRequest) {
    return this.projectsService.findAll(request.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.projectsService.findOne(id, request.user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.projectsService.update(
      id,
      updateProjectDto,
      request.user.id,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.projectsService.remove(id, request.user.id);
  }
}