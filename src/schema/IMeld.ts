import { ICardStack } from "./ICardStack";

export interface IMeld extends ICardStack {
    meldType: 'mixed' | 'natural';
    isCanasta: boolean;
}