import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Service } from "./service.entity";

@Entity({name: 'follows'})
export class Follow {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_discord: string;

    @ManyToOne(() => Service, service => service.follows)
    @JoinColumn({name: 'serviceId'})
    service: Service;

    @Column()
    serviceId: number;

    @Column({default: false})
    enable: boolean;
}