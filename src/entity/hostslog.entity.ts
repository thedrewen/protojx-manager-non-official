import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'hosts_logs'})
export class HostsLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    host: string;

    @Column()
    status: boolean;

    @CreateDateColumn()
    created_at: Date;
}   