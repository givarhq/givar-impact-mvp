import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/project.dto';

@Controller('projects')
export class ProjectController {
  constructor(private service: ProjectService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }

  // Admin only in real app, keeping open for MVP setup or protected
  @UseGuards(AuthGuard('jwt')) 
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto);
  }
}