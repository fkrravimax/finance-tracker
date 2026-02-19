
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

// Fade In Component
interface FadeInProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    fullWidth?: boolean;
}

export const FadeIn = ({ children, delay = 0, direction = 'up', fullWidth = false, className = '', ...props }: FadeInProps) => {
    const directions = {
        up: { y: 20, x: 0 },
        down: { y: -20, x: 0 },
        left: { x: 20, y: 0 },
        right: { x: -20, y: 0 },
        none: { x: 0, y: 0 },
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className={`${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Stagger Container
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    staggerChildren?: number;
    delayChildren?: number;
}

export const StaggerContainer = ({ children, staggerChildren = 0.1, delayChildren = 0, className = '', ...props }: StaggerContainerProps) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: {},
                show: {
                    transition: {
                        staggerChildren,
                        delayChildren,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Scale Button
interface ScaleButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode;
}

export const ScaleButton = ({ children, className = '', ...props }: ScaleButtonProps) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={className}
            {...props}
        >
            {children}
        </motion.button>
    );
};

// Item for Stagger Container
export const StaggerItem = ({ children, className = '', ...props }: HTMLMotionProps<"div">) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}
