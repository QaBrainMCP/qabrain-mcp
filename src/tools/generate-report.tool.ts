import { qaReportService } from "../qa/services/qa-report.service.js";
import { logger } from "../utils/logger.js";

export async function generateReport(feature: string) {

    const report = qaReportService.generate(feature);

    logger.info("\n" + report);

    return report;

}