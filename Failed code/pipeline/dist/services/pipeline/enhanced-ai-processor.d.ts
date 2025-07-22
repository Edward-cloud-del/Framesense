export default enhancedAIProcessor;
declare const enhancedAIProcessor: EnhancedAIProcessor;
/**
 * Enhanced AI Processor - Main Orchestration Pipeline
 * MOMENT 5.1: Integrates all DAY 1-4 components into unified system
 *
 * Features:
 * - Question classification and intelligent routing
 * - Tier-based access control and cost optimization
 * - Multi-layer caching with cache-first strategy
 * - Comprehensive analytics and performance tracking
 * - Service execution with fallback management
 * - Response optimization and standardization
 */
declare class EnhancedAIProcessor {
    cacheManager: {
        redisCache: {
            client: import("@redis/client").RedisClientType<{
                graph: {
                    CONFIG_GET: typeof import("@redis/graph/dist/commands/CONFIG_GET.js");
                    configGet: typeof import("@redis/graph/dist/commands/CONFIG_GET.js");
                    CONFIG_SET: typeof import("@redis/graph/dist/commands/CONFIG_SET.js");
                    configSet: typeof import("@redis/graph/dist/commands/CONFIG_SET.js");
                    DELETE: typeof import("@redis/graph/dist/commands/DELETE.js");
                    delete: typeof import("@redis/graph/dist/commands/DELETE.js");
                    EXPLAIN: typeof import("@redis/graph/dist/commands/EXPLAIN.js");
                    explain: typeof import("@redis/graph/dist/commands/EXPLAIN.js");
                    LIST: typeof import("@redis/graph/dist/commands/LIST.js");
                    list: typeof import("@redis/graph/dist/commands/LIST.js");
                    PROFILE: typeof import("@redis/graph/dist/commands/PROFILE.js");
                    profile: typeof import("@redis/graph/dist/commands/PROFILE.js");
                    QUERY: typeof import("@redis/graph/dist/commands/QUERY.js");
                    query: typeof import("@redis/graph/dist/commands/QUERY.js");
                    RO_QUERY: typeof import("@redis/graph/dist/commands/RO_QUERY.js");
                    roQuery: typeof import("@redis/graph/dist/commands/RO_QUERY.js");
                    SLOWLOG: typeof import("@redis/graph/dist/commands/SLOWLOG.js");
                    slowLog: typeof import("@redis/graph/dist/commands/SLOWLOG.js");
                };
                json: {
                    ARRAPPEND: typeof import("@redis/json/dist/commands/ARRAPPEND.js");
                    arrAppend: typeof import("@redis/json/dist/commands/ARRAPPEND.js");
                    ARRINDEX: typeof import("@redis/json/dist/commands/ARRINDEX.js");
                    arrIndex: typeof import("@redis/json/dist/commands/ARRINDEX.js");
                    ARRINSERT: typeof import("@redis/json/dist/commands/ARRINSERT.js");
                    arrInsert: typeof import("@redis/json/dist/commands/ARRINSERT.js");
                    ARRLEN: typeof import("@redis/json/dist/commands/ARRLEN.js");
                    arrLen: typeof import("@redis/json/dist/commands/ARRLEN.js");
                    ARRPOP: typeof import("@redis/json/dist/commands/ARRPOP.js");
                    arrPop: typeof import("@redis/json/dist/commands/ARRPOP.js");
                    ARRTRIM: typeof import("@redis/json/dist/commands/ARRTRIM.js");
                    arrTrim: typeof import("@redis/json/dist/commands/ARRTRIM.js");
                    DEBUG_MEMORY: typeof import("@redis/json/dist/commands/DEBUG_MEMORY.js");
                    debugMemory: typeof import("@redis/json/dist/commands/DEBUG_MEMORY.js");
                    DEL: typeof import("@redis/json/dist/commands/DEL.js");
                    del: typeof import("@redis/json/dist/commands/DEL.js");
                    FORGET: typeof import("@redis/json/dist/commands/FORGET.js");
                    forget: typeof import("@redis/json/dist/commands/FORGET.js");
                    GET: typeof import("@redis/json/dist/commands/GET.js");
                    get: typeof import("@redis/json/dist/commands/GET.js");
                    MERGE: typeof import("@redis/json/dist/commands/MERGE.js");
                    merge: typeof import("@redis/json/dist/commands/MERGE.js");
                    MGET: typeof import("@redis/json/dist/commands/MGET.js");
                    mGet: typeof import("@redis/json/dist/commands/MGET.js");
                    MSET: typeof import("@redis/json/dist/commands/MSET.js");
                    mSet: typeof import("@redis/json/dist/commands/MSET.js");
                    NUMINCRBY: typeof import("@redis/json/dist/commands/NUMINCRBY.js");
                    numIncrBy: typeof import("@redis/json/dist/commands/NUMINCRBY.js");
                    NUMMULTBY: typeof import("@redis/json/dist/commands/NUMMULTBY.js");
                    numMultBy: typeof import("@redis/json/dist/commands/NUMMULTBY.js");
                    OBJKEYS: typeof import("@redis/json/dist/commands/OBJKEYS.js");
                    objKeys: typeof import("@redis/json/dist/commands/OBJKEYS.js");
                    OBJLEN: typeof import("@redis/json/dist/commands/OBJLEN.js");
                    objLen: typeof import("@redis/json/dist/commands/OBJLEN.js");
                    RESP: typeof import("@redis/json/dist/commands/RESP.js");
                    resp: typeof import("@redis/json/dist/commands/RESP.js");
                    SET: typeof import("@redis/json/dist/commands/SET.js");
                    set: typeof import("@redis/json/dist/commands/SET.js");
                    STRAPPEND: typeof import("@redis/json/dist/commands/STRAPPEND.js");
                    strAppend: typeof import("@redis/json/dist/commands/STRAPPEND.js");
                    STRLEN: typeof import("@redis/json/dist/commands/STRLEN.js");
                    strLen: typeof import("@redis/json/dist/commands/STRLEN.js");
                    TYPE: typeof import("@redis/json/dist/commands/TYPE.js");
                    type: typeof import("@redis/json/dist/commands/TYPE.js");
                };
                ft: {
                    _LIST: typeof import("@redis/search/dist/commands/_LIST.js");
                    _list: typeof import("@redis/search/dist/commands/_LIST.js");
                    ALTER: typeof import("@redis/search/dist/commands/ALTER.js");
                    alter: typeof import("@redis/search/dist/commands/ALTER.js");
                    AGGREGATE_WITHCURSOR: typeof import("@redis/search/dist/commands/AGGREGATE_WITHCURSOR.js");
                    aggregateWithCursor: typeof import("@redis/search/dist/commands/AGGREGATE_WITHCURSOR.js");
                    AGGREGATE: typeof import("@redis/search/dist/commands/AGGREGATE.js");
                    aggregate: typeof import("@redis/search/dist/commands/AGGREGATE.js");
                    ALIASADD: typeof import("@redis/search/dist/commands/ALIASADD.js");
                    aliasAdd: typeof import("@redis/search/dist/commands/ALIASADD.js");
                    ALIASDEL: typeof import("@redis/search/dist/commands/ALIASDEL.js");
                    aliasDel: typeof import("@redis/search/dist/commands/ALIASDEL.js");
                    ALIASUPDATE: typeof import("@redis/search/dist/commands/ALIASUPDATE.js");
                    aliasUpdate: typeof import("@redis/search/dist/commands/ALIASUPDATE.js");
                    CONFIG_GET: typeof import("@redis/search/dist/commands/CONFIG_GET.js");
                    configGet: typeof import("@redis/search/dist/commands/CONFIG_GET.js");
                    CONFIG_SET: typeof import("@redis/search/dist/commands/CONFIG_SET.js");
                    configSet: typeof import("@redis/search/dist/commands/CONFIG_SET.js");
                    CREATE: typeof import("@redis/search/dist/commands/CREATE.js");
                    create: typeof import("@redis/search/dist/commands/CREATE.js");
                    CURSOR_DEL: typeof import("@redis/search/dist/commands/CURSOR_DEL.js");
                    cursorDel: typeof import("@redis/search/dist/commands/CURSOR_DEL.js");
                    CURSOR_READ: typeof import("@redis/search/dist/commands/CURSOR_READ.js");
                    cursorRead: typeof import("@redis/search/dist/commands/CURSOR_READ.js");
                    DICTADD: typeof import("@redis/search/dist/commands/DICTADD.js");
                    dictAdd: typeof import("@redis/search/dist/commands/DICTADD.js");
                    DICTDEL: typeof import("@redis/search/dist/commands/DICTDEL.js");
                    dictDel: typeof import("@redis/search/dist/commands/DICTDEL.js");
                    DICTDUMP: typeof import("@redis/search/dist/commands/DICTDUMP.js");
                    dictDump: typeof import("@redis/search/dist/commands/DICTDUMP.js");
                    DROPINDEX: typeof import("@redis/search/dist/commands/DROPINDEX.js");
                    dropIndex: typeof import("@redis/search/dist/commands/DROPINDEX.js");
                    EXPLAIN: typeof import("@redis/search/dist/commands/EXPLAIN.js");
                    explain: typeof import("@redis/search/dist/commands/EXPLAIN.js");
                    EXPLAINCLI: typeof import("@redis/search/dist/commands/EXPLAINCLI.js");
                    explainCli: typeof import("@redis/search/dist/commands/EXPLAINCLI.js");
                    INFO: typeof import("@redis/search/dist/commands/INFO.js");
                    info: typeof import("@redis/search/dist/commands/INFO.js");
                    PROFILESEARCH: typeof import("@redis/search/dist/commands/PROFILE_SEARCH.js");
                    profileSearch: typeof import("@redis/search/dist/commands/PROFILE_SEARCH.js");
                    PROFILEAGGREGATE: typeof import("@redis/search/dist/commands/PROFILE_AGGREGATE.js");
                    profileAggregate: typeof import("@redis/search/dist/commands/PROFILE_AGGREGATE.js");
                    SEARCH: typeof import("@redis/search/dist/commands/SEARCH.js");
                    search: typeof import("@redis/search/dist/commands/SEARCH.js");
                    SEARCH_NOCONTENT: typeof import("@redis/search/dist/commands/SEARCH_NOCONTENT.js");
                    searchNoContent: typeof import("@redis/search/dist/commands/SEARCH_NOCONTENT.js");
                    SPELLCHECK: typeof import("@redis/search/dist/commands/SPELLCHECK.js");
                    spellCheck: typeof import("@redis/search/dist/commands/SPELLCHECK.js");
                    SUGADD: typeof import("@redis/search/dist/commands/SUGADD.js");
                    sugAdd: typeof import("@redis/search/dist/commands/SUGADD.js");
                    SUGDEL: typeof import("@redis/search/dist/commands/SUGDEL.js");
                    sugDel: typeof import("@redis/search/dist/commands/SUGDEL.js");
                    SUGGET_WITHPAYLOADS: typeof import("@redis/search/dist/commands/SUGGET_WITHPAYLOADS.js");
                    sugGetWithPayloads: typeof import("@redis/search/dist/commands/SUGGET_WITHPAYLOADS.js");
                    SUGGET_WITHSCORES_WITHPAYLOADS: typeof import("@redis/search/dist/commands/SUGGET_WITHSCORES_WITHPAYLOADS.js");
                    sugGetWithScoresWithPayloads: typeof import("@redis/search/dist/commands/SUGGET_WITHSCORES_WITHPAYLOADS.js");
                    SUGGET_WITHSCORES: typeof import("@redis/search/dist/commands/SUGGET_WITHSCORES.js");
                    sugGetWithScores: typeof import("@redis/search/dist/commands/SUGGET_WITHSCORES.js");
                    SUGGET: typeof import("@redis/search/dist/commands/SUGGET.js");
                    sugGet: typeof import("@redis/search/dist/commands/SUGGET.js");
                    SUGLEN: typeof import("@redis/search/dist/commands/SUGLEN.js");
                    sugLen: typeof import("@redis/search/dist/commands/SUGLEN.js");
                    SYNDUMP: typeof import("@redis/search/dist/commands/SYNDUMP.js");
                    synDump: typeof import("@redis/search/dist/commands/SYNDUMP.js");
                    SYNUPDATE: typeof import("@redis/search/dist/commands/SYNUPDATE.js");
                    synUpdate: typeof import("@redis/search/dist/commands/SYNUPDATE.js");
                    TAGVALS: typeof import("@redis/search/dist/commands/TAGVALS.js");
                    tagVals: typeof import("@redis/search/dist/commands/TAGVALS.js");
                };
                ts: {
                    ADD: typeof import("@redis/time-series/dist/commands/ADD.js");
                    add: typeof import("@redis/time-series/dist/commands/ADD.js");
                    ALTER: typeof import("@redis/time-series/dist/commands/ALTER.js");
                    alter: typeof import("@redis/time-series/dist/commands/ALTER.js");
                    CREATE: typeof import("@redis/time-series/dist/commands/CREATE.js");
                    create: typeof import("@redis/time-series/dist/commands/CREATE.js");
                    CREATERULE: typeof import("@redis/time-series/dist/commands/CREATERULE.js");
                    createRule: typeof import("@redis/time-series/dist/commands/CREATERULE.js");
                    DECRBY: typeof import("@redis/time-series/dist/commands/DECRBY.js");
                    decrBy: typeof import("@redis/time-series/dist/commands/DECRBY.js");
                    DEL: typeof import("@redis/time-series/dist/commands/DEL.js");
                    del: typeof import("@redis/time-series/dist/commands/DEL.js");
                    DELETERULE: typeof import("@redis/time-series/dist/commands/DELETERULE.js");
                    deleteRule: typeof import("@redis/time-series/dist/commands/DELETERULE.js");
                    GET: typeof import("@redis/time-series/dist/commands/GET.js");
                    get: typeof import("@redis/time-series/dist/commands/GET.js");
                    INCRBY: typeof import("@redis/time-series/dist/commands/INCRBY.js");
                    incrBy: typeof import("@redis/time-series/dist/commands/INCRBY.js");
                    INFO_DEBUG: typeof import("@redis/time-series/dist/commands/INFO_DEBUG.js");
                    infoDebug: typeof import("@redis/time-series/dist/commands/INFO_DEBUG.js");
                    INFO: typeof import("@redis/time-series/dist/commands/INFO.js");
                    info: typeof import("@redis/time-series/dist/commands/INFO.js");
                    MADD: typeof import("@redis/time-series/dist/commands/MADD.js");
                    mAdd: typeof import("@redis/time-series/dist/commands/MADD.js");
                    MGET: typeof import("@redis/time-series/dist/commands/MGET.js");
                    mGet: typeof import("@redis/time-series/dist/commands/MGET.js");
                    MGET_WITHLABELS: typeof import("@redis/time-series/dist/commands/MGET_WITHLABELS.js");
                    mGetWithLabels: typeof import("@redis/time-series/dist/commands/MGET_WITHLABELS.js");
                    QUERYINDEX: typeof import("@redis/time-series/dist/commands/QUERYINDEX.js");
                    queryIndex: typeof import("@redis/time-series/dist/commands/QUERYINDEX.js");
                    RANGE: typeof import("@redis/time-series/dist/commands/RANGE.js");
                    range: typeof import("@redis/time-series/dist/commands/RANGE.js");
                    REVRANGE: typeof import("@redis/time-series/dist/commands/REVRANGE.js");
                    revRange: typeof import("@redis/time-series/dist/commands/REVRANGE.js");
                    MRANGE: typeof import("@redis/time-series/dist/commands/MRANGE.js");
                    mRange: typeof import("@redis/time-series/dist/commands/MRANGE.js");
                    MRANGE_WITHLABELS: typeof import("@redis/time-series/dist/commands/MRANGE_WITHLABELS.js");
                    mRangeWithLabels: typeof import("@redis/time-series/dist/commands/MRANGE_WITHLABELS.js");
                    MREVRANGE: typeof import("@redis/time-series/dist/commands/MREVRANGE.js");
                    mRevRange: typeof import("@redis/time-series/dist/commands/MREVRANGE.js");
                    MREVRANGE_WITHLABELS: typeof import("@redis/time-series/dist/commands/MREVRANGE_WITHLABELS.js");
                    mRevRangeWithLabels: typeof import("@redis/time-series/dist/commands/MREVRANGE_WITHLABELS.js");
                };
                bf: {
                    ADD: typeof import("@redis/bloom/dist/commands/bloom/ADD.js");
                    add: typeof import("@redis/bloom/dist/commands/bloom/ADD.js");
                    CARD: typeof import("@redis/bloom/dist/commands/bloom/CARD.js");
                    card: typeof import("@redis/bloom/dist/commands/bloom/CARD.js");
                    EXISTS: typeof import("@redis/bloom/dist/commands/bloom/EXISTS.js");
                    exists: typeof import("@redis/bloom/dist/commands/bloom/EXISTS.js");
                    INFO: typeof import("@redis/bloom/dist/commands/bloom/INFO.js");
                    info: typeof import("@redis/bloom/dist/commands/bloom/INFO.js");
                    INSERT: typeof import("@redis/bloom/dist/commands/bloom/INSERT.js");
                    insert: typeof import("@redis/bloom/dist/commands/bloom/INSERT.js");
                    LOADCHUNK: typeof import("@redis/bloom/dist/commands/bloom/LOADCHUNK.js");
                    loadChunk: typeof import("@redis/bloom/dist/commands/bloom/LOADCHUNK.js");
                    MADD: typeof import("@redis/bloom/dist/commands/bloom/MADD.js");
                    mAdd: typeof import("@redis/bloom/dist/commands/bloom/MADD.js");
                    MEXISTS: typeof import("@redis/bloom/dist/commands/bloom/MEXISTS.js");
                    mExists: typeof import("@redis/bloom/dist/commands/bloom/MEXISTS.js");
                    RESERVE: typeof import("@redis/bloom/dist/commands/bloom/RESERVE.js");
                    reserve: typeof import("@redis/bloom/dist/commands/bloom/RESERVE.js");
                    SCANDUMP: typeof import("@redis/bloom/dist/commands/bloom/SCANDUMP.js");
                    scanDump: typeof import("@redis/bloom/dist/commands/bloom/SCANDUMP.js");
                };
                cms: {
                    INCRBY: typeof import("@redis/bloom/dist/commands/count-min-sketch/INCRBY.js");
                    incrBy: typeof import("@redis/bloom/dist/commands/count-min-sketch/INCRBY.js");
                    INFO: typeof import("@redis/bloom/dist/commands/count-min-sketch/INFO.js");
                    info: typeof import("@redis/bloom/dist/commands/count-min-sketch/INFO.js");
                    INITBYDIM: typeof import("@redis/bloom/dist/commands/count-min-sketch/INITBYDIM.js");
                    initByDim: typeof import("@redis/bloom/dist/commands/count-min-sketch/INITBYDIM.js");
                    INITBYPROB: typeof import("@redis/bloom/dist/commands/count-min-sketch/INITBYPROB.js");
                    initByProb: typeof import("@redis/bloom/dist/commands/count-min-sketch/INITBYPROB.js");
                    MERGE: typeof import("@redis/bloom/dist/commands/count-min-sketch/MERGE.js");
                    merge: typeof import("@redis/bloom/dist/commands/count-min-sketch/MERGE.js");
                    QUERY: typeof import("@redis/bloom/dist/commands/count-min-sketch/QUERY.js");
                    query: typeof import("@redis/bloom/dist/commands/count-min-sketch/QUERY.js");
                };
                cf: {
                    ADD: typeof import("@redis/bloom/dist/commands/cuckoo/ADD.js");
                    add: typeof import("@redis/bloom/dist/commands/cuckoo/ADD.js");
                    ADDNX: typeof import("@redis/bloom/dist/commands/cuckoo/ADDNX.js");
                    addNX: typeof import("@redis/bloom/dist/commands/cuckoo/ADDNX.js");
                    COUNT: typeof import("@redis/bloom/dist/commands/cuckoo/COUNT.js");
                    count: typeof import("@redis/bloom/dist/commands/cuckoo/COUNT.js");
                    DEL: typeof import("@redis/bloom/dist/commands/cuckoo/DEL.js");
                    del: typeof import("@redis/bloom/dist/commands/cuckoo/DEL.js");
                    EXISTS: typeof import("@redis/bloom/dist/commands/cuckoo/EXISTS.js");
                    exists: typeof import("@redis/bloom/dist/commands/cuckoo/EXISTS.js");
                    INFO: typeof import("@redis/bloom/dist/commands/cuckoo/INFO.js");
                    info: typeof import("@redis/bloom/dist/commands/cuckoo/INFO.js");
                    INSERT: typeof import("@redis/bloom/dist/commands/cuckoo/INSERT.js");
                    insert: typeof import("@redis/bloom/dist/commands/cuckoo/INSERT.js");
                    INSERTNX: typeof import("@redis/bloom/dist/commands/cuckoo/INSERTNX.js");
                    insertNX: typeof import("@redis/bloom/dist/commands/cuckoo/INSERTNX.js");
                    LOADCHUNK: typeof import("@redis/bloom/dist/commands/cuckoo/LOADCHUNK.js");
                    loadChunk: typeof import("@redis/bloom/dist/commands/cuckoo/LOADCHUNK.js");
                    RESERVE: typeof import("@redis/bloom/dist/commands/cuckoo/RESERVE.js");
                    reserve: typeof import("@redis/bloom/dist/commands/cuckoo/RESERVE.js");
                    SCANDUMP: typeof import("@redis/bloom/dist/commands/cuckoo/SCANDUMP.js");
                    scanDump: typeof import("@redis/bloom/dist/commands/cuckoo/SCANDUMP.js");
                };
                tDigest: {
                    ADD: typeof import("@redis/bloom/dist/commands/t-digest/ADD.js");
                    add: typeof import("@redis/bloom/dist/commands/t-digest/ADD.js");
                    BYRANK: typeof import("@redis/bloom/dist/commands/t-digest/BYRANK.js");
                    byRank: typeof import("@redis/bloom/dist/commands/t-digest/BYRANK.js");
                    BYREVRANK: typeof import("@redis/bloom/dist/commands/t-digest/BYREVRANK.js");
                    byRevRank: typeof import("@redis/bloom/dist/commands/t-digest/BYREVRANK.js");
                    CDF: typeof import("@redis/bloom/dist/commands/t-digest/CDF.js");
                    cdf: typeof import("@redis/bloom/dist/commands/t-digest/CDF.js");
                    CREATE: typeof import("@redis/bloom/dist/commands/t-digest/CREATE.js");
                    create: typeof import("@redis/bloom/dist/commands/t-digest/CREATE.js");
                    INFO: typeof import("@redis/bloom/dist/commands/t-digest/INFO.js");
                    info: typeof import("@redis/bloom/dist/commands/t-digest/INFO.js");
                    MAX: typeof import("@redis/bloom/dist/commands/t-digest/MAX.js");
                    max: typeof import("@redis/bloom/dist/commands/t-digest/MAX.js");
                    MERGE: typeof import("@redis/bloom/dist/commands/t-digest/MERGE.js");
                    merge: typeof import("@redis/bloom/dist/commands/t-digest/MERGE.js");
                    MIN: typeof import("@redis/bloom/dist/commands/t-digest/MIN.js");
                    min: typeof import("@redis/bloom/dist/commands/t-digest/MIN.js");
                    QUANTILE: typeof import("@redis/bloom/dist/commands/t-digest/QUANTILE.js");
                    quantile: typeof import("@redis/bloom/dist/commands/t-digest/QUANTILE.js");
                    RANK: typeof import("@redis/bloom/dist/commands/t-digest/RANK.js");
                    rank: typeof import("@redis/bloom/dist/commands/t-digest/RANK.js");
                    RESET: typeof import("@redis/bloom/dist/commands/t-digest/RESET.js");
                    reset: typeof import("@redis/bloom/dist/commands/t-digest/RESET.js");
                    REVRANK: typeof import("@redis/bloom/dist/commands/t-digest/REVRANK.js");
                    revRank: typeof import("@redis/bloom/dist/commands/t-digest/REVRANK.js");
                    TRIMMED_MEAN: typeof import("@redis/bloom/dist/commands/t-digest/TRIMMED_MEAN.js");
                    trimmedMean: typeof import("@redis/bloom/dist/commands/t-digest/TRIMMED_MEAN.js");
                };
                topK: {
                    ADD: typeof import("@redis/bloom/dist/commands/top-k/ADD.js");
                    add: typeof import("@redis/bloom/dist/commands/top-k/ADD.js");
                    COUNT: typeof import("@redis/bloom/dist/commands/top-k/COUNT.js");
                    count: typeof import("@redis/bloom/dist/commands/top-k/COUNT.js");
                    INCRBY: typeof import("@redis/bloom/dist/commands/top-k/INCRBY.js");
                    incrBy: typeof import("@redis/bloom/dist/commands/top-k/INCRBY.js");
                    INFO: typeof import("@redis/bloom/dist/commands/top-k/INFO.js");
                    info: typeof import("@redis/bloom/dist/commands/top-k/INFO.js");
                    LIST_WITHCOUNT: typeof import("@redis/bloom/dist/commands/top-k/LIST_WITHCOUNT.js");
                    listWithCount: typeof import("@redis/bloom/dist/commands/top-k/LIST_WITHCOUNT.js");
                    LIST: typeof import("@redis/bloom/dist/commands/top-k/LIST.js");
                    list: typeof import("@redis/bloom/dist/commands/top-k/LIST.js");
                    QUERY: typeof import("@redis/bloom/dist/commands/top-k/QUERY.js");
                    query: typeof import("@redis/bloom/dist/commands/top-k/QUERY.js");
                    RESERVE: typeof import("@redis/bloom/dist/commands/top-k/RESERVE.js");
                    reserve: typeof import("@redis/bloom/dist/commands/top-k/RESERVE.js");
                };
            } & import("redis").RedisModules, import("redis").RedisFunctions, import("redis").RedisScripts> | null;
            isConnected: boolean;
            connectionAttempts: number;
            maxRetries: number;
            poolConfig: {
                socket: {
                    host: string;
                    port: string | number;
                    connectTimeout: number;
                    lazyConnect: boolean;
                    reconnectStrategy: (retries: any) => number | false;
                };
                password: string | undefined;
                database: number;
                isolationPoolOptions: {
                    min: number;
                    max: number;
                    acquireTimeoutMillis: number;
                    idleTimeoutMillis: number;
                };
            };
            metrics: {
                connections: number;
                disconnections: number;
                errors: number;
                commands: number;
                hits: number;
                misses: number;
                totalResponseTime: number;
                lastError: null;
                startTime: number;
            };
            initialize(): Promise<void>;
            configurePersistence(): Promise<void>;
            get(key: any): Promise<any>;
            set(key: any, value: any, ttlSeconds?: number): Promise<boolean>;
            del(key: any): Promise<boolean>;
            exists(key: any): Promise<boolean>;
            expire(key: any, ttlSeconds: any): Promise<boolean>;
            keys(pattern: any): Promise<string[]>;
            deletePattern(pattern: any): Promise<number>;
            getMetrics(): {
                isConnected: boolean;
                uptime: number;
                commands: number;
                hits: number;
                misses: number;
                hitRate: number;
                errors: number;
                connections: number;
                disconnections: number;
                avgResponseTime: number;
                lastError: null;
            };
            healthCheck(): Promise<{
                status: string;
                reason: string;
                pingTime?: undefined;
                usedMemory?: undefined;
                metrics?: undefined;
            } | {
                status: string;
                pingTime: number;
                usedMemory: number | null;
                metrics: {
                    isConnected: boolean;
                    uptime: number;
                    commands: number;
                    hits: number;
                    misses: number;
                    hitRate: number;
                    errors: number;
                    connections: number;
                    disconnections: number;
                    avgResponseTime: number;
                    lastError: null;
                };
                reason?: undefined;
            } | {
                status: string;
                reason: any;
                metrics: {
                    isConnected: boolean;
                    uptime: number;
                    commands: number;
                    hits: number;
                    misses: number;
                    hitRate: number;
                    errors: number;
                    connections: number;
                    disconnections: number;
                    avgResponseTime: number;
                    lastError: null;
                };
                pingTime?: undefined;
                usedMemory?: undefined;
            }>;
            disconnect(): Promise<void>;
            reconnect(): Promise<void>;
        };
        metrics: {
            totalRequests: number;
            redisHits: number;
            misses: number;
            compressionSavings: number;
            averageResponseTime: number;
            totalResponseTime: number;
            invalidatedItems: number;
            costSavings: {
                total: number;
                byService: {};
            };
        };
        warmingConfig: {
            enabled: boolean;
            popularThreshold: number;
            warmingInterval: number;
            popularQueries: Map<any, any>;
        };
        compressionConfig: {
            enabled: boolean;
            minSizeBytes: number;
            algorithm: string;
            level: number;
        };
        generateKey(imageData: any, question: any, questionType: any, userTier: any): Promise<any>;
        get(cacheKey: any, ...args: any[]): Promise<any>;
        getByServiceType(serviceType: any, imageData: any, options?: {}): Promise<{
            data: any;
            cached: boolean;
            source: string;
            responseTime: number;
            cacheKey: any;
            error?: undefined;
        } | {
            data: null;
            cached: boolean;
            source: string;
            responseTime: number;
            error: any;
            cacheKey?: undefined;
        }>;
        set(cacheKey: any, data: any, options?: {}): Promise<boolean>;
        setByServiceType(serviceType: any, imageData: any, data: any, options?: {}): Promise<{
            success: boolean;
            cacheKey: any;
            storage: string;
            compressed: boolean;
            originalSize: number;
            compressedSize: number;
            costSaved: any;
            responseTime: number;
            error?: undefined;
        } | {
            success: boolean;
            error: any;
            responseTime: number;
            cacheKey?: undefined;
            storage?: undefined;
            compressed?: undefined;
            originalSize?: undefined;
            compressedSize?: undefined;
            costSaved?: undefined;
        }>;
        invalidate(pattern: any): Promise<{
            success: boolean;
            invalidatedCount: number;
            pattern: any;
            responseTime: number;
            error?: undefined;
        } | {
            success: boolean;
            error: any;
            responseTime: number;
            invalidatedCount?: undefined;
            pattern?: undefined;
        }>;
        trackPopularQuery(serviceType: any, imageData: any, options: any): void;
        calculateCostSavings(serviceType: any, costImpact: any): any;
        trackCostSavings(serviceType: any, costSaved: any): void;
        updateResponseTimeMetrics(responseTime: any): void;
        getMetrics(): {
            totalRequests: number;
            redisHits: number;
            misses: number;
            hitRate: number;
            averageResponseTime: number;
            compressionSavings: number;
            invalidatedItems: number;
            costSavings: {
                total: number;
                byService: {};
            };
            popularQueriesCount: number;
            redisMetrics: {
                isConnected: boolean;
                uptime: number;
                commands: number;
                hits: number;
                misses: number;
                hitRate: number;
                errors: number;
                connections: number;
                disconnections: number;
                avgResponseTime: number;
                lastError: null;
            };
            cacheKeyMetrics: {
                imageCacheSize: number;
                questionCacheSize: number;
                hashCacheHitRate: number;
                hashComputations: number;
                cacheHits: number;
                hashCacheHits: number;
                averageHashTime: number;
            };
        };
        healthCheck(): Promise<{
            status: string;
            redis: {
                status: string;
                reason: string;
                pingTime?: undefined;
                usedMemory?: undefined;
                metrics?: undefined;
            } | {
                status: string;
                pingTime: number;
                usedMemory: number | null;
                metrics: {
                    isConnected: boolean;
                    uptime: number;
                    commands: number;
                    hits: number;
                    misses: number;
                    hitRate: number;
                    errors: number;
                    connections: number;
                    disconnections: number;
                    avgResponseTime: number;
                    lastError: null;
                };
                reason?: undefined;
            } | {
                status: string;
                reason: any;
                metrics: {
                    isConnected: boolean;
                    uptime: number;
                    commands: number;
                    hits: number;
                    misses: number;
                    hitRate: number;
                    errors: number;
                    connections: number;
                    disconnections: number;
                    avgResponseTime: number;
                    lastError: null;
                };
                pingTime?: undefined;
                usedMemory?: undefined;
            };
            metrics: {
                totalRequests: number;
                redisHits: number;
                misses: number;
                hitRate: number;
                averageResponseTime: number;
                compressionSavings: number;
                invalidatedItems: number;
                costSavings: {
                    total: number;
                    byService: {};
                };
                popularQueriesCount: number;
                redisMetrics: {
                    isConnected: boolean;
                    uptime: number;
                    commands: number;
                    hits: number;
                    misses: number;
                    hitRate: number;
                    errors: number;
                    connections: number;
                    disconnections: number;
                    avgResponseTime: number;
                    lastError: null;
                };
                cacheKeyMetrics: {
                    imageCacheSize: number;
                    questionCacheSize: number;
                    hashCacheHitRate: number;
                    hashComputations: number;
                    cacheHits: number;
                    hashCacheHits: number;
                    averageHashTime: number;
                };
            };
            error?: undefined;
        } | {
            status: string;
            error: any;
            metrics: {
                totalRequests: number;
                redisHits: number;
                misses: number;
                hitRate: number;
                averageResponseTime: number;
                compressionSavings: number;
                invalidatedItems: number;
                costSavings: {
                    total: number;
                    byService: {};
                };
                popularQueriesCount: number;
                redisMetrics: {
                    isConnected: boolean;
                    uptime: number;
                    commands: number;
                    hits: number;
                    misses: number;
                    hitRate: number;
                    errors: number;
                    connections: number;
                    disconnections: number;
                    avgResponseTime: number;
                    lastError: null;
                };
                cacheKeyMetrics: {
                    imageCacheSize: number;
                    questionCacheSize: number;
                    hashCacheHitRate: number;
                    hashComputations: number;
                    cacheHits: number;
                    hashCacheHits: number;
                    averageHashTime: number;
                };
            };
            redis?: undefined;
        }>;
        warmCache(serviceType: any, imageData: any, options?: {}): Promise<{
            success: boolean;
            serviceType: any;
            error?: undefined;
        } | {
            success: boolean;
            error: any;
            serviceType?: undefined;
        }>;
        clearPopularQueries(): void;
    };
    responseOptimizer: {
        encoders: Map<any, any>;
        strategies: {
            OPENAI_RESPONSES: {
                tokenOptimization: boolean;
                metadataStripping: string;
                formatStandardization: boolean;
                redundancyRemoval: boolean;
                compressionLevel: string;
            };
            GOOGLE_VISION_WEB: {
                tokenOptimization: boolean;
                metadataStripping: string;
                formatStandardization: boolean;
                redundancyRemoval: boolean;
                compressionLevel: string;
            };
            GOOGLE_VISION_OBJECTS: {
                tokenOptimization: boolean;
                metadataStripping: string;
                formatStandardization: boolean;
                redundancyRemoval: boolean;
                compressionLevel: string;
            };
            OCR_RESULTS: {
                tokenOptimization: boolean;
                metadataStripping: string;
                formatStandardization: boolean;
                redundancyRemoval: boolean;
                compressionLevel: string;
            };
            CELEBRITY_IDS: {
                tokenOptimization: boolean;
                metadataStripping: string;
                formatStandardization: boolean;
                redundancyRemoval: boolean;
                compressionLevel: string;
            };
        };
        tierOptimizations: {
            free: {
                detailLevel: string;
                maxResponseSize: number;
                stripSensitiveData: boolean;
                compressResponse: boolean;
            };
            pro: {
                detailLevel: string;
                maxResponseSize: number;
                stripSensitiveData: boolean;
                compressResponse: boolean;
            };
            premium: {
                detailLevel: string;
                maxResponseSize: number;
                stripSensitiveData: boolean;
                compressResponse: boolean;
            };
        };
        metrics: {
            totalOptimizations: number;
            tokensSaved: number;
            bytesSaved: number;
            compressionRatio: number;
            averageOptimizationTime: number;
            totalOptimizationTime: number;
            optimizationsByService: {};
        };
        getTokenEncoder(model?: string): any;
        calculateTokens(text: any, model?: string): any;
        optimizeForCache(response: any, serviceType: any): {
            optimized: any;
            originalSize: number;
            optimizedSize: number;
            optimizationTime: number;
            strategy: any;
            error?: undefined;
        } | {
            optimized: any;
            originalSize: number;
            optimizedSize: number;
            optimizationTime: number;
            error: any;
            strategy?: undefined;
        };
        optimizeForTransmission(response: any, userTier?: string, serviceType?: string): Promise<{
            optimized: any;
            compressed: {
                data: string;
                originalSize: number;
                compressedSize: number;
                compressionRatio: number;
                algorithm: string;
            } | null;
            originalSize: number;
            optimizedSize: number;
            compressionRatio: number;
            optimizationTime: number;
            tierConfig: any;
            error?: undefined;
        } | {
            optimized: any;
            compressed: null;
            optimizationTime: number;
            error: any;
            originalSize?: undefined;
            optimizedSize?: undefined;
            compressionRatio?: undefined;
            tierConfig?: undefined;
        }>;
        optimizeTokens(response: any): any;
        removeRedundantPhrases(text: any): any;
        stripMetadata(response: any, level: any): any;
        standardizeFormat(response: any, serviceType: any): {
            service: any;
            timestamp: number;
            data: null;
            metadata: {};
        };
        removeRedundancy(response: any): any;
        removeDuplicateEntities(entities: any): any;
        removeDuplicateTextAnnotations(annotations: any): any;
        adjustDetailLevel(response: any, detailLevel: any, serviceType: any): any;
        enforceSizeLimit(response: any, maxSize: any): any;
        stripSensitiveData(response: any): any;
        compressResponse(response: any): Promise<{
            data: string;
            originalSize: number;
            compressedSize: number;
            compressionRatio: number;
            algorithm: string;
        } | null>;
        updateMetrics(serviceType: any, original: any, optimized: any, optimizationTime: any): void;
        getMetrics(): {
            totalOptimizations: number;
            tokensSaved: number;
            bytesSaved: number;
            averageBytesSaved: number;
            averageOptimizationTime: number;
            optimizationsByService: {};
            compressionRatio: number;
        };
        healthCheck(): {
            status: string;
            tokenEncodingWorking: boolean;
            encodersLoaded: number;
            metrics: {
                totalOptimizations: number;
                tokensSaved: number;
                bytesSaved: number;
                averageBytesSaved: number;
                averageOptimizationTime: number;
                optimizationsByService: {};
                compressionRatio: number;
            };
            error?: undefined;
        } | {
            status: string;
            error: any;
            metrics: {
                totalOptimizations: number;
                tokensSaved: number;
                bytesSaved: number;
                averageBytesSaved: number;
                averageOptimizationTime: number;
                optimizationsByService: {};
                compressionRatio: number;
            };
            tokenEncodingWorking?: undefined;
            encodersLoaded?: undefined;
        };
        clearMetrics(): void;
    };
    analyticsTracker: {
        analytics: {
            requests: {
                total: number;
                byService: {};
                byUser: {};
                byTier: {};
                byHour: {};
                byDay: {};
                successful: number;
                failed: number;
            };
            performance: {
                totalResponseTime: number;
                averageResponseTime: number;
                byService: {};
                slowestRequests: never[];
                fastestRequests: never[];
            };
            costs: {
                total: number;
                saved: number;
                byService: {};
                byUser: {};
                byTier: {};
                dailySpend: {};
                monthlySpend: {};
            };
            cache: {
                totalRequests: number;
                hits: number;
                misses: number;
                hitRate: number;
                byService: {};
                savings: {
                    time: number;
                    cost: number;
                };
            };
            quality: {
                averageConfidence: number;
                byService: {};
                userSatisfaction: {};
                errorTypes: {};
            };
            usage: {
                peakHours: {};
                popularServices: {};
                userPatterns: {};
                tierUtilization: {};
            };
        };
        serviceCosts: {
            OCR_RESULTS: number;
            ENHANCED_OCR: number;
            GOOGLE_VISION_TEXT: number;
            GOOGLE_VISION_OBJECTS: number;
            GOOGLE_VISION_WEB: number;
            GOOGLE_VISION_LOGO: number;
            CELEBRITY_IDS: number;
            OPENAI_RESPONSES: number;
            OPEN_SOURCE_API: number;
        };
        tierMultipliers: {
            free: number;
            pro: number;
            premium: number;
        };
        persistenceConfig: {
            enabled: boolean;
            interval: number;
            dataFile: string;
            backupInterval: number;
            maxBackups: number;
        };
        realtimeMetrics: {
            currentHourRequests: number;
            currentDayRequests: number;
            lastHourCosts: number;
            activeUsers: Set<any>;
            recentErrors: never[];
        };
        initialize(): Promise<void>;
        trackRequest(requestData: any): Promise<{
            success: boolean;
            cost: number;
            cached: any;
            timestamp: number;
            error?: undefined;
        } | {
            success: boolean;
            error: any;
            timestamp: number;
            cost?: undefined;
            cached?: undefined;
        }>;
        trackCachePerformance(cacheEvent: any): void;
        trackError(error: any, service: any, userId: any): void;
        categorizeError(error: any): "validation_error" | "timeout" | "rate_limit" | "auth_error" | "unknown_error" | "not_found" | "network_error" | "token_error";
        trackUserSatisfaction(userId: any, rating: any, feedback?: string, service?: null): void;
        trackUsagePatterns(userId: any, service: any, questionType: any, hour: any, day: any): void;
        calculateRequestCost(service: any, userTier: any, cached?: boolean): number;
        generateReport(userId?: null, timeRange?: string, breakdown?: string): {
            metadata: {
                generatedAt: string;
                timeRange: string;
                breakdown: string;
                userId: string;
            };
            summary: {
                totalRequests: any;
                totalCost: any;
                costSaved: number;
                averageResponseTime: number;
                cacheHitRate: number;
                successRate: number;
                activeUsers: number;
                topServices: {
                    service: string;
                    count: any;
                    percentage: number;
                }[];
                recentErrors: never[];
            };
            details: {};
        } | {
            error: any;
            generatedAt: string;
        };
        generateSummary(userId: any, timeRange: any): {
            totalRequests: any;
            totalCost: any;
            costSaved: number;
            averageResponseTime: number;
            cacheHitRate: number;
            successRate: number;
            activeUsers: number;
            topServices: {
                service: string;
                count: any;
                percentage: number;
            }[];
            recentErrors: never[];
        };
        getTopServices(limit?: number): {
            service: string;
            count: any;
            percentage: number;
        }[];
        generateServiceBreakdown(userId: any, timeRange: any): {};
        generateTimeBreakdown(userId: any, timeRange: any): {
            hourly: {};
            daily: {};
            peakHours: {};
        };
        generateCostBreakdown(userId: any, timeRange: any): {
            totalCost: number;
            costSaved: number;
            byService: {};
            byTier: {};
            dailySpend: {};
            projectedMonthlyCost: number;
        };
        generatePerformanceBreakdown(userId: any, timeRange: any): {
            overall: {
                averageResponseTime: number;
                totalRequests: number;
                successRate: number;
            };
            byService: {};
            cache: {
                hitRate: number;
                timeSaved: number;
                costSaved: number;
            };
            errors: {};
        };
        calculateProjectedMonthlyCost(): number;
        getRealtimeMetrics(): {
            activeUsers: number;
            currentUtilization: number;
            systemHealth: number;
            currentHourRequests: number;
            currentDayRequests: number;
            lastHourCosts: number;
            recentErrors: never[];
        };
        calculateCurrentUtilization(): number;
        calculateSystemHealth(): number;
        startRealtimeTracking(): void;
        startPersistence(): void;
        saveAnalyticsData(): Promise<void>;
        loadAnalyticsData(): Promise<void>;
        createBackup(): Promise<void>;
        getMetrics(): {
            requests: {
                total: number;
                byService: {};
                byUser: {};
                byTier: {};
                byHour: {};
                byDay: {};
                successful: number;
                failed: number;
            };
            performance: {
                totalResponseTime: number;
                averageResponseTime: number;
                byService: {};
                slowestRequests: never[];
                fastestRequests: never[];
            };
            costs: {
                total: number;
                saved: number;
                byService: {};
                byUser: {};
                byTier: {};
                dailySpend: {};
                monthlySpend: {};
            };
            cache: {
                totalRequests: number;
                hits: number;
                misses: number;
                hitRate: number;
                byService: {};
                savings: {
                    time: number;
                    cost: number;
                };
            };
            quality: {
                averageConfidence: number;
                byService: {};
                userSatisfaction: {};
                errorTypes: {};
            };
            usage: {
                peakHours: {};
                popularServices: {};
                userPatterns: {};
                tierUtilization: {};
            };
            realtime: {
                activeUsers: number;
                currentUtilization: number;
                systemHealth: number;
                currentHourRequests: number;
                currentDayRequests: number;
                lastHourCosts: number;
                recentErrors: never[];
            };
        };
        healthCheck(): {
            status: string;
            dataIntegrity: boolean;
            persistenceEnabled: boolean;
            realtimeTracking: boolean;
            metrics: {
                totalRequests: number;
                totalCosts: number;
                systemHealth: number;
            };
        };
        clearAllData(): void;
    };
    userService: {
        createUser(email: string, password: string, name: string): Promise<import("../user-service.js").UserWithToken>;
        loginUser(email: string, password: string): Promise<import("../user-service.js").UserWithToken>;
        verifyToken(token: string): Promise<import("../user-service.js").User>;
        updateUserTier(email: string, tier: string, subscriptionStatus?: string): Promise<void>;
        updateUserStripeCustomerId(email: string, stripeCustomerId: string): Promise<void>;
        getUserByStripeCustomerId(stripeCustomerId: string): Promise<import("../user-service.js").User | null>;
        getUserById(userId: string): Promise<import("../user-service.js").User | null>;
        getUserByEmail(email: string): Promise<import("../user-service.js").User | null>;
        saveSession(userId: string, token: string): Promise<void>;
        logoutUser(token: string): Promise<void>;
        cleanupExpiredSessions(): Promise<void>;
    };
    questionClassifier: QuestionClassifier;
    modelSelector: ModelSelector;
    tierAccess: TierAccess;
    costOptimizer: CostOptimizer;
    fallbackManager: FallbackManager;
    smartRouter: SmartRouter;
    googleVision: import("../enhanced-services/google-vision.js").GoogleVisionService;
    enhancedOCR: import("../enhanced-services/enhanced-ocr.js").EnhancedOCR | null;
    serviceRegistry: {
        'enhanced-ocr': null;
        'google-vision-text': import("../enhanced-services/google-vision.js").GoogleVisionService;
        'google-vision-objects': import("../enhanced-services/google-vision.js").GoogleVisionService;
        'google-vision-web': import("../enhanced-services/google-vision.js").GoogleVisionService;
        'google-vision-logo': import("../enhanced-services/google-vision.js").GoogleVisionService;
        'openai-vision': null;
        'open-source-api': null;
    };
    metrics: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        cacheHitRate: number;
        totalCostSaved: number;
    };
    /**
     * Initialize Enhanced OCR with dynamic import (CommonJS compatibility)
     */
    initializeEnhancedOCR(): Promise<void>;
    /**
     * Main entry point for AI analysis requests
     * @param {Buffer|string} imageData - Image data (buffer or base64)
     * @param {string} question - User's question about the image
     * @param {string} userId - User ID for tracking and access control
     * @param {Object} options - Additional options (model preference, cache strategy, etc.)
     * @returns {Object} Processed AI response with metadata
     */
    processAnalysisRequest(imageData: Buffer | string, question: string, userId: string, options?: Object): Object;
    activeRequests: Set<any> | undefined;
    /**
     * Service Execution Engine - MOMENT 5.2 Integration
     * Executes the appropriate AI service based on routing decision
     */
    executeService(routing: any, imageData: any, question: any, userProfile: any): any;
    /**
     * Validate and preprocess incoming request
     */
    validateRequest(imageData: any, question: any, userId: any): Promise<{
        question: string;
        imageData: string | Buffer<ArrayBufferLike> | null;
        imageSize: number;
        userId: any;
    }>;
    /**
     * Check if image data contains a valid image
     * @param {string|Buffer|null} imageData - The image data to validate
     * @returns {boolean} True if valid image data is present
     */
    hasValidImageData(imageData: string | Buffer | null): boolean;
    /**
     * Analyze text context for intelligent responses
     */
    analyzeTextContext(text: any): "very short text or symbols" | "numerical data" | "terminal or command output" | "error or warning message" | "greeting or welcome text" | "text content";
    /**
     * Generate contextual response based on question and text
     */
    generateContextualResponse(question: any, text: any): string;
    /**
     * Determine if this is a text-only request that should not go to OCR
     * @param {Object} questionType - The classified question type
     * @param {string} question - The user's question
     * @returns {boolean} True if this is a text-only conversational request
     */
    isTextOnlyRequest(questionType: Object, question: string): boolean;
    /**
     * Handle text-only requests with appropriate responses
     * @param {string} question - The user's question
     * @param {Object} questionType - The classified question type
     * @returns {Object} Response object for text-only request
     */
    handleTextOnlyRequest(question: string, questionType: Object): Object;
    /**
     * Get user profile with tier and preferences
     */
    getUserProfile(userId: any): Promise<{
        id: string;
        email: string;
        tier: string;
        subscription_status: string;
        preferences: any;
        usage: any;
        budget: any;
        costOptimization: any;
    } | {
        id: any;
        email: string;
        tier: string;
        preferences: {};
        usage: {
            daily: number;
            monthly: number;
        };
        budget: {
            daily: number;
            monthly: number;
        };
        costOptimization: boolean;
    }>;
    /**
     * Format response with standardized structure
     */
    formatResponse(result: any, source: any, metadata?: {}): {
        success: boolean;
        source: any;
        result: any;
        metadata: {
            requestId: any;
            responseTime: any;
            serviceResponseTime: any;
            cost: any;
            model: any;
            cached: any;
            optimization: any;
            confidence: any;
            timestamp: string;
            service: any;
        };
    };
    /**
     * Handle errors with graceful degradation
     */
    handleError(error: any, question: any, userId: any, requestId: any, responseTime: any): Promise<{
        success: boolean;
        error: any;
        metadata: {
            requestId: any;
            responseTime: any;
            timestamp: string;
            suggestion: string;
        };
    }>;
    /**
     * Get cache TTL based on service type
     */
    getCacheTTL(service: any): any;
    /**
     * Update performance metrics
     */
    updateMetrics(responseTime: any, cost: any): void;
    /**
     * Generate unique request ID
     */
    generateRequestId(): string;
    /**
     * Get error suggestion based on error message
     */
    getErrorSuggestion(errorMessage: any): "This feature requires a premium subscription. Please upgrade your plan." | "You have reached your rate limit. Please try again later or upgrade your plan." | "Please check your image format and size. Supported formats: JPG, PNG, WebP. Max size: 50MB." | "Please try again or contact support if the issue persists.";
    /**
     * Health check for the enhanced AI processor
     */
    healthCheck(): Promise<{
        status: string;
        components: {
            questionClassifier: string;
            smartRouter: string;
            cacheManager: {
                status: string;
                redis: {
                    status: string;
                    reason: string;
                    pingTime?: undefined;
                    usedMemory?: undefined;
                    metrics?: undefined;
                } | {
                    status: string;
                    pingTime: number;
                    usedMemory: number | null;
                    metrics: {
                        isConnected: boolean;
                        uptime: number;
                        commands: number;
                        hits: number;
                        misses: number;
                        hitRate: number;
                        errors: number;
                        connections: number;
                        disconnections: number;
                        avgResponseTime: number;
                        lastError: null;
                    };
                    reason?: undefined;
                } | {
                    status: string;
                    reason: any;
                    metrics: {
                        isConnected: boolean;
                        uptime: number;
                        commands: number;
                        hits: number;
                        misses: number;
                        hitRate: number;
                        errors: number;
                        connections: number;
                        disconnections: number;
                        avgResponseTime: number;
                        lastError: null;
                    };
                    pingTime?: undefined;
                    usedMemory?: undefined;
                };
                metrics: {
                    totalRequests: number;
                    redisHits: number;
                    misses: number;
                    hitRate: number;
                    averageResponseTime: number;
                    compressionSavings: number;
                    invalidatedItems: number;
                    costSavings: {
                        total: number;
                        byService: {};
                    };
                    popularQueriesCount: number;
                    redisMetrics: {
                        isConnected: boolean;
                        uptime: number;
                        commands: number;
                        hits: number;
                        misses: number;
                        hitRate: number;
                        errors: number;
                        connections: number;
                        disconnections: number;
                        avgResponseTime: number;
                        lastError: null;
                    };
                    cacheKeyMetrics: {
                        imageCacheSize: number;
                        questionCacheSize: number;
                        hashCacheHitRate: number;
                        hashComputations: number;
                        cacheHits: number;
                        hashCacheHits: number;
                        averageHashTime: number;
                    };
                };
                error?: undefined;
            } | {
                status: string;
                error: any;
                metrics: {
                    totalRequests: number;
                    redisHits: number;
                    misses: number;
                    hitRate: number;
                    averageResponseTime: number;
                    compressionSavings: number;
                    invalidatedItems: number;
                    costSavings: {
                        total: number;
                        byService: {};
                    };
                    popularQueriesCount: number;
                    redisMetrics: {
                        isConnected: boolean;
                        uptime: number;
                        commands: number;
                        hits: number;
                        misses: number;
                        hitRate: number;
                        errors: number;
                        connections: number;
                        disconnections: number;
                        avgResponseTime: number;
                        lastError: null;
                    };
                    cacheKeyMetrics: {
                        imageCacheSize: number;
                        questionCacheSize: number;
                        hashCacheHitRate: number;
                        hashComputations: number;
                        cacheHits: number;
                        hashCacheHits: number;
                        averageHashTime: number;
                    };
                };
                redis?: undefined;
            };
            responseOptimizer: {
                status: string;
                tokenEncodingWorking: boolean;
                encodersLoaded: number;
                metrics: {
                    totalOptimizations: number;
                    tokensSaved: number;
                    bytesSaved: number;
                    averageBytesSaved: number;
                    averageOptimizationTime: number;
                    optimizationsByService: {};
                    compressionRatio: number;
                };
                error?: undefined;
            } | {
                status: string;
                error: any;
                metrics: {
                    totalOptimizations: number;
                    tokensSaved: number;
                    bytesSaved: number;
                    averageBytesSaved: number;
                    averageOptimizationTime: number;
                    optimizationsByService: {};
                    compressionRatio: number;
                };
                tokenEncodingWorking?: undefined;
                encodersLoaded?: undefined;
            };
            analyticsTracker: {
                status: string;
                dataIntegrity: boolean;
                persistenceEnabled: boolean;
                realtimeTracking: boolean;
                metrics: {
                    totalRequests: number;
                    totalCosts: number;
                    systemHealth: number;
                };
            };
            googleVision: {
                healthy: boolean;
                message: string;
                timestamp: string;
            };
            enhancedOCR: string;
        };
        metrics: {
            totalRequests: number;
            successfulRequests: number;
            failedRequests: number;
            averageResponseTime: number;
            cacheHitRate: number;
            totalCostSaved: number;
        };
        timestamp: string;
        error?: undefined;
    } | {
        status: string;
        error: any;
        timestamp: string;
        components?: undefined;
        metrics?: undefined;
    }>;
    /**
     * Get performance metrics
     */
    getMetrics(): {
        analyticsData: {
            requests: {
                total: number;
                byService: {};
                byUser: {};
                byTier: {};
                byHour: {};
                byDay: {};
                successful: number;
                failed: number;
            };
            performance: {
                totalResponseTime: number;
                averageResponseTime: number;
                byService: {};
                slowestRequests: never[];
                fastestRequests: never[];
            };
            costs: {
                total: number;
                saved: number;
                byService: {};
                byUser: {};
                byTier: {};
                dailySpend: {};
                monthlySpend: {};
            };
            cache: {
                totalRequests: number;
                hits: number;
                misses: number;
                hitRate: number;
                byService: {};
                savings: {
                    time: number;
                    cost: number;
                };
            };
            quality: {
                averageConfidence: number;
                byService: {};
                userSatisfaction: {};
                errorTypes: {};
            };
            usage: {
                peakHours: {};
                popularServices: {};
                userPatterns: {};
                tierUtilization: {};
            };
        };
        timestamp: string;
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        cacheHitRate: number;
        totalCostSaved: number;
    };
}
import { QuestionClassifier } from '../classification/question-classifier.js';
import { ModelSelector } from '../classification/model-selector.js';
import { TierAccess } from '../routing/tier-access.js';
import { CostOptimizer } from '../routing/cost-optimizer.js';
import { FallbackManager } from '../routing/fallback-manager.js';
import { SmartRouter } from '../routing/smart-router.js';
