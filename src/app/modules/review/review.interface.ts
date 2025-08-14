
export interface IPetReview {
  // sitterId: string;
  dogId: string;
  review: string;
  rating: number;
}

export interface IClientReview {
  // sitterId: string;  // fixed typo here
  clientId: string;
  review: string;
  rating: number;
}

export interface IReview {
  petData: IPetReview;
  clientData: IClientReview;
  sitterId: string
}