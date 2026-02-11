export class CreateMarketPlaceDto {
  title: string;
  description?: string;
  price: number;
  images?: string[];
  category?: string;
}
