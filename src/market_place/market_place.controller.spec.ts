import { Test, TestingModule } from '@nestjs/testing';
import { MarketPlaceController } from './market_place.controller';
import { MarketPlaceService } from './market_place.service';

describe('MarketPlaceController', () => {
  let controller: MarketPlaceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketPlaceController],
      providers: [MarketPlaceService],
    }).compile();

    controller = module.get<MarketPlaceController>(MarketPlaceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
