import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { HostsLog } from "./hostslog.entity";
import { Follow } from "./follow.entity";

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
    notify: boolean


    @OneToMany(() => HostsLog, log => log.service)
    logs: HostsLog[];

    @OneToMany(() => Follow, follow => follow.service)
    follows: Follow[];
}