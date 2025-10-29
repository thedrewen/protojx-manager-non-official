import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Guild {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    guild_id: string;

    @Column()
    persistent_message_id: string;
}