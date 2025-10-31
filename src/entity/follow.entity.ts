import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'follows'})
export class Follow {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_discord: string;

    @Column({default: false})
    enable: boolean;
}