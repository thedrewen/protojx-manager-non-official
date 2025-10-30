import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Follow {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_discord: string;

    @Column({default: false})
    enable: boolean;
}