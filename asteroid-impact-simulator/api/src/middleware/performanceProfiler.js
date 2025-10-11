/**
 * Performance Profiler Middleware
 * Trace l'exécution des fonctions pour identifier les goulots d'étranglement
 */

class PerformanceProfiler {
    constructor() {
        this.traces = [];
        this.enabled = process.env.ENABLE_PROFILING === 'true';
    }

    /**
     * Wrapper une fonction async pour mesurer son temps d'exécution
     */
    trace(name, fn) {
        if (!this.enabled) {
            return fn;
        }

        return async function(...args) {
            const start = Date.now();
            try {
                const result = await fn.apply(this, args);
                const duration = Date.now() - start;
                console.log(`⏱️  [TRACE] ${name}: ${duration}ms`);
                return result;
            } catch (error) {
                const duration = Date.now() - start;
                console.error(`❌ [TRACE ERROR] ${name}: ${duration}ms - ${error.message}`);
                throw error;
            }
        };
    }

    /**
     * Trace un bloc de code synchrone
     */
    traceSync(name, fn) {
        if (!this.enabled) {
            return fn();
        }

        const start = Date.now();
        try {
            const result = fn();
            const duration = Date.now() - start;
            console.log(`⏱️  [TRACE] ${name}: ${duration}ms`);
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            console.error(`❌ [TRACE ERROR] ${name}: ${duration}ms - ${error.message}`);
            throw error;
        }
    }

    /**
     * Middleware Express pour logger le temps total de requête
     */
    middleware() {
        return (req, res, next) => {
            const start = Date.now();

            // Intercept la réponse
            const originalSend = res.send;
            res.send = function(data) {
                const duration = Date.now() - start;
                console.log(`\n🎯 [REQUEST] ${req.method} ${req.path}: ${duration}ms\n`);
                originalSend.apply(res, arguments);
            };

            next();
        };
    }
}

module.exports = new PerformanceProfiler();
