import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Service } from "./service.entity";

@Entity({name: 'hosts_logs'})
export class HostsLog {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Service, service => service.logs)
    @JoinColumn({name: 'serviceId'})
    service: Service;

    @Column()
    serviceId: number;

    @Column()
    status: boolean;

    @CreateDateColumn()
    created_at: Date;
}   