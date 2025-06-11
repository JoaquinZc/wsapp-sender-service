import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { RepeatersService } from './repeaters.service';
import { CreateRepeaterDto } from './dto/create-repeater.dto';
import { DeleteRepeaterDto } from './dto/delete-repeater.dto';

@Controller('repeaters')
export class RepeatersController {
  constructor(private readonly repeatersService: RepeatersService) {}

  @Get()
  async getList() {
    const data = await this.repeatersService.getList();
    return data;
  }

  @Post()
  async add(@Body() createRepeaterDto: CreateRepeaterDto) {
    const data = await this.repeatersService.create(createRepeaterDto);
    return data;
  }

  @Delete()
  async delete(@Query() deleteRepeaterDto: DeleteRepeaterDto) {
    const data = await this.repeatersService.remove(deleteRepeaterDto.id);
    return data;
  }
}
