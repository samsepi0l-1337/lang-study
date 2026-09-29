import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateLanguageDto } from './create-language.dto';
import { Language, LanguagesService } from './languages.service';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languages: LanguagesService) {}

  @Get()
  list(): Language[] {
    return this.languages.findAll();
  }

  @Get(':id')
  one(@Param('id', ParseIntPipe) id: number): Language {
    return this.languages.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLanguageDto): Language {
    return this.languages.create(dto);
  }
}
