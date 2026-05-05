import { PartialType } from '@nestjs/swagger';
import { CreateMarketPlaceDto } from './create-market_place.dto';

export class UpdateMarketPlaceDto extends PartialType(CreateMarketPlaceDto) { }