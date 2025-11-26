import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'services'})
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    host: string;

    @Column()
    alive: boolean;

    @Column()
    ping_type: string;

    @Column()
    type: string;
    
    @Column()
    notify: boolean;
}